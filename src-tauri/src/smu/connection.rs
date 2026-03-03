use std::ffi::CString;
use std::sync::Arc;
use tokio::sync::Mutex;
use libloading::{Library, Symbol};

// NI-VISA type aliases
type ViStatus = i32;
type ViSession = u32;
type ViAccessMode = u32;
type ViUInt32 = u32;

const VI_SUCCESS: ViStatus = 0;
const VI_NULL: ViAccessMode = 0;

// VISA attribute IDs
const VI_ATTR_TMO_VALUE: ViUInt32 = 0x3FFF001A;

// Function pointer types matching VISA C API
type FnViOpenDefaultRM = unsafe extern "C" fn(*mut ViSession) -> ViStatus;
type FnViOpen = unsafe extern "C" fn(ViSession, *const i8, ViAccessMode, ViUInt32, *mut ViSession) -> ViStatus;
type FnViClose = unsafe extern "C" fn(ViSession) -> ViStatus;
type FnViWrite = unsafe extern "C" fn(ViSession, *const u8, ViUInt32, *mut u32) -> ViStatus;
type FnViRead = unsafe extern "C" fn(ViSession, *mut u8, ViUInt32, *mut u32) -> ViStatus;
type FnViSetAttribute = unsafe extern "C" fn(ViSession, ViUInt32, u64) -> ViStatus;

/// Holds the dynamically loaded VISA library and resolved function pointers.
struct VisaLib {
    _lib: Library, // must stay alive so function pointers remain valid
    vi_open_default_rm: FnViOpenDefaultRM,
    vi_open: FnViOpen,
    vi_close: FnViClose,
    vi_write: FnViWrite,
    vi_read: FnViRead,
    vi_set_attribute: FnViSetAttribute,
}

// SAFETY: The VISA library and function pointers are thread-safe when protected by our Mutex
unsafe impl Send for VisaLib {}
unsafe impl Sync for VisaLib {}

impl VisaLib {
    fn load() -> Result<Self, String> {
        let lib = unsafe { Library::new("visa64.dll") }.map_err(|_| {
            "NI-VISA not found. Please install the NI-VISA runtime from:\nhttps://www.ni.com/en/support/downloads/drivers/download.ni-visa.html".to_string()
        })?;

        unsafe {
            let vi_open_default_rm: Symbol<FnViOpenDefaultRM> = lib.get(b"viOpenDefaultRM")
                .map_err(|e| format!("Failed to load viOpenDefaultRM: {}", e))?;
            let vi_open: Symbol<FnViOpen> = lib.get(b"viOpen")
                .map_err(|e| format!("Failed to load viOpen: {}", e))?;
            let vi_close: Symbol<FnViClose> = lib.get(b"viClose")
                .map_err(|e| format!("Failed to load viClose: {}", e))?;
            let vi_write: Symbol<FnViWrite> = lib.get(b"viWrite")
                .map_err(|e| format!("Failed to load viWrite: {}", e))?;
            let vi_read: Symbol<FnViRead> = lib.get(b"viRead")
                .map_err(|e| format!("Failed to load viRead: {}", e))?;
            let vi_set_attribute: Symbol<FnViSetAttribute> = lib.get(b"viSetAttribute")
                .map_err(|e| format!("Failed to load viSetAttribute: {}", e))?;

            Ok(Self {
                vi_open_default_rm: *vi_open_default_rm,
                vi_open: *vi_open,
                vi_close: *vi_close,
                vi_write: *vi_write,
                vi_read: *vi_read,
                vi_set_attribute: *vi_set_attribute,
                _lib: lib,
            })
        }
    }
}

struct VisaHandle {
    lib: VisaLib,
    rm: ViSession,
    instr: ViSession,
}

// SAFETY: Protected by our Mutex
unsafe impl Send for VisaHandle {}
unsafe impl Sync for VisaHandle {}

impl Drop for VisaHandle {
    fn drop(&mut self) {
        unsafe {
            (self.lib.vi_close)(self.instr);
            (self.lib.vi_close)(self.rm);
        }
    }
}

pub struct SMUConnection {
    handle: Arc<Mutex<VisaHandle>>,
    pub resource_string: String,
}

impl SMUConnection {
    pub async fn connect(resource: &str) -> Result<Self, String> {
        let resource_cstr = CString::new(resource)
            .map_err(|_| "Invalid resource string".to_string())?;
        let resource_owned = resource.to_string();

        let handle = tokio::task::spawn_blocking(move || -> Result<VisaHandle, String> {
            // Load VISA library dynamically
            let lib = VisaLib::load()?;

            unsafe {
                let mut rm: ViSession = 0;
                let status = (lib.vi_open_default_rm)(&mut rm);
                if status < VI_SUCCESS {
                    return Err(format!(
                        "Failed to open VISA Resource Manager (error {}). Is NI-VISA installed?",
                        status
                    ));
                }

                let mut instr: ViSession = 0;
                let status = (lib.vi_open)(
                    rm,
                    resource_cstr.as_ptr(),
                    VI_NULL,
                    5000,
                    &mut instr,
                );
                if status < VI_SUCCESS {
                    (lib.vi_close)(rm);
                    return Err(format!(
                        "Failed to open instrument '{}' (error {}). Check GPIB address and connections.",
                        resource_cstr.to_str().unwrap_or("?"),
                        status
                    ));
                }

                // Set timeout to 30 seconds for read/write operations
                (lib.vi_set_attribute)(instr, VI_ATTR_TMO_VALUE, 30000);

                Ok(VisaHandle { lib, rm, instr })
            }
        })
        .await
        .map_err(|e| format!("Spawn error: {}", e))??;

        Ok(Self {
            handle: Arc::new(Mutex::new(handle)),
            resource_string: resource_owned,
        })
    }

    pub async fn send_command(&self, cmd: &str) -> Result<(), String> {
        let handle = self.handle.clone();
        let cmd_with_newline = format!("{}\n", cmd);

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            let h = handle.blocking_lock();
            let buf = cmd_with_newline.as_bytes();
            let mut ret_count: u32 = 0;
            unsafe {
                let status = (h.lib.vi_write)(h.instr, buf.as_ptr(), buf.len() as u32, &mut ret_count);
                if status < VI_SUCCESS {
                    return Err(format!("VISA write failed (error {})", status));
                }
            }
            Ok(())
        })
        .await
        .map_err(|e| format!("Spawn error: {}", e))?
    }

    /// Send an entire multi-line TSP script as a single VISA write,
    /// wrapped in loadscript/endscript so the instrument buffers it
    /// before executing (matches how Keithley TSB sends scripts).
    pub async fn send_script(&self, script: &str) -> Result<(), String> {
        let handle = self.handle.clone();
        let block = format!("loadscript\n{}\nendscript\n", script);

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            let h = handle.blocking_lock();
            let buf = block.as_bytes();
            let mut ret_count: u32 = 0;
            unsafe {
                let status = (h.lib.vi_write)(h.instr, buf.as_ptr(), buf.len() as u32, &mut ret_count);
                if status < VI_SUCCESS {
                    return Err(format!("VISA write failed (error {})", status));
                }
            }
            Ok(())
        })
        .await
        .map_err(|e| format!("Spawn error: {}", e))?
    }

    pub async fn send_query(&self, cmd: &str) -> Result<String, String> {
        let handle = self.handle.clone();
        let cmd_with_newline = format!("{}\n", cmd);

        tokio::task::spawn_blocking(move || -> Result<String, String> {
            let h = handle.blocking_lock();

            // Write
            let buf = cmd_with_newline.as_bytes();
            let mut ret_count: u32 = 0;
            unsafe {
                let status = (h.lib.vi_write)(h.instr, buf.as_ptr(), buf.len() as u32, &mut ret_count);
                if status < VI_SUCCESS {
                    return Err(format!("VISA write failed (error {})", status));
                }
            }

            // Small delay to let instrument process
            std::thread::sleep(std::time::Duration::from_millis(50));

            // Read
            let mut read_buf = vec![0u8; 65536];
            let mut read_count: u32 = 0;
            unsafe {
                let status = (h.lib.vi_read)(
                    h.instr,
                    read_buf.as_mut_ptr(),
                    read_buf.len() as u32,
                    &mut read_count,
                );
                // VI_SUCCESS_MAX_CNT (0x3FFF0006) is also acceptable
                if status < VI_SUCCESS && status != 0x3FFF0006_u32 as i32 {
                    return Err(format!("VISA read failed (error {})", status));
                }
            }

            let response = String::from_utf8_lossy(&read_buf[..read_count as usize])
                .trim()
                .to_string();
            Ok(response)
        })
        .await
        .map_err(|e| format!("Spawn error: {}", e))?
    }
}
