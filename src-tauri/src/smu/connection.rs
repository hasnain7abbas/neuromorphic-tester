use std::ffi::CString;
use std::sync::Arc;
use tokio::sync::Mutex;

// NI-VISA type aliases
type ViStatus = i32;
type ViSession = u32;
type ViRsrc = *const i8;
type ViAccessMode = u32;
type ViBuf = *const u8;
type ViBufMut = *mut u8;
type ViUInt32 = u32;
type ViPUInt32 = *mut u32;

const VI_SUCCESS: ViStatus = 0;
const VI_NULL: ViAccessMode = 0;
const VI_TMO_INFINITE: ViUInt32 = 0xFFFFFFFF;

#[link(name = "visa64", kind = "raw-dylib")]
extern "C" {
    fn viOpenDefaultRM(sesn: *mut ViSession) -> ViStatus;
    fn viOpen(
        sesn: ViSession,
        rsrc: ViRsrc,
        access_mode: ViAccessMode,
        timeout: ViUInt32,
        vi: *mut ViSession,
    ) -> ViStatus;
    fn viClose(vi: ViSession) -> ViStatus;
    fn viWrite(
        vi: ViSession,
        buf: ViBuf,
        count: ViUInt32,
        ret_count: ViPUInt32,
    ) -> ViStatus;
    fn viRead(
        vi: ViSession,
        buf: ViBufMut,
        count: ViUInt32,
        ret_count: ViPUInt32,
    ) -> ViStatus;
    fn viSetAttribute(vi: ViSession, attr: ViUInt32, value: u64) -> ViStatus;
}

// VISA attribute IDs
const VI_ATTR_TMO_VALUE: ViUInt32 = 0x3FFF001A;

struct VisaHandle {
    rm: ViSession,
    instr: ViSession,
}

// SAFETY: The VISA handles are protected by our Mutex
unsafe impl Send for VisaHandle {}
unsafe impl Sync for VisaHandle {}

impl Drop for VisaHandle {
    fn drop(&mut self) {
        unsafe {
            viClose(self.instr);
            viClose(self.rm);
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

        let (rm, instr) = tokio::task::spawn_blocking(move || -> Result<(ViSession, ViSession), String> {
            unsafe {
                let mut rm: ViSession = 0;
                let status = viOpenDefaultRM(&mut rm);
                if status < VI_SUCCESS {
                    return Err(format!("Failed to open VISA Resource Manager (error {}). Is NI-VISA installed?", status));
                }

                let mut instr: ViSession = 0;
                let status = viOpen(
                    rm,
                    resource_cstr.as_ptr(),
                    VI_NULL,
                    5000, // 5 second timeout for open
                    &mut instr,
                );
                if status < VI_SUCCESS {
                    viClose(rm);
                    return Err(format!(
                        "Failed to open instrument '{}' (error {}). Check GPIB address and connections.",
                        resource_cstr.to_str().unwrap_or("?"),
                        status
                    ));
                }

                // Set timeout to 30 seconds for read/write operations
                viSetAttribute(instr, VI_ATTR_TMO_VALUE, 30000);

                Ok((rm, instr))
            }
        })
        .await
        .map_err(|e| format!("Spawn error: {}", e))??;

        Ok(Self {
            handle: Arc::new(Mutex::new(VisaHandle { rm, instr })),
            resource_string: resource.to_string(),
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
                let status = viWrite(h.instr, buf.as_ptr(), buf.len() as u32, &mut ret_count);
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
                let status = viWrite(h.instr, buf.as_ptr(), buf.len() as u32, &mut ret_count);
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
                let status = viRead(
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
