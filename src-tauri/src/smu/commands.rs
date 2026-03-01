pub fn reset_channel_a() -> &'static str {
    "smua.reset()"
}

pub fn output_off() -> &'static str {
    "smua.source.output = smua.OUTPUT_OFF"
}

pub fn output_on() -> &'static str {
    "smua.source.output = smua.OUTPUT_ON"
}

pub fn clear_buffer1() -> &'static str {
    "smua.nvbuffer1.clear()"
}

pub fn clear_buffer2() -> &'static str {
    "smua.nvbuffer2.clear()"
}

pub fn clear_error_queue() -> &'static str {
    "errorqueue.clear()"
}

pub fn query_buffer_count(buffer: &str) -> String {
    format!("print({}.n)", buffer)
}

pub fn print_buffer(buffer: &str, start: usize, end: usize) -> String {
    format!("printbuffer({}, {}, {})", start, end, buffer)
}

pub fn query_identity() -> &'static str {
    "*IDN?"
}
