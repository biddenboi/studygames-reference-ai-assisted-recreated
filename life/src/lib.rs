// Game of Life for the browser. No wasm-bindgen, just plain exported functions.
// JS reads the cells straight out of wasm memory using cells_ptr().

use std::ptr::addr_of;

const WIDTH: usize = 64;
const HEIGHT: usize = 48;

static mut CELLS: [u8; WIDTH * HEIGHT] = [0; WIDTH * HEIGHT];
static mut NEXT: [u8; WIDTH * HEIGHT] = [0; WIDTH * HEIGHT];

fn index(x: usize, y: usize) -> usize {
    y * WIDTH + x
}

// counts the 8 neighbours. edges wrap around so gliders don't die at the wall
unsafe fn neighbours(x: usize, y: usize) -> u8 {
    let mut count = 0;
    for dy in [HEIGHT - 1, 0, 1] {
        for dx in [WIDTH - 1, 0, 1] {
            if dx == 0 && dy == 0 {
                continue;
            }
            let nx = (x + dx) % WIDTH;
            let ny = (y + dy) % HEIGHT;
            count += CELLS[index(nx, ny)];
        }
    }
    count
}

#[no_mangle]
pub extern "C" fn width() -> usize {
    WIDTH
}

#[no_mangle]
pub extern "C" fn height() -> usize {
    HEIGHT
}

#[no_mangle]
pub extern "C" fn cells_ptr() -> *const u8 {
    addr_of!(CELLS) as *const u8
}

#[no_mangle]
pub extern "C" fn tick() {
    unsafe {
        for y in 0..HEIGHT {
            for x in 0..WIDTH {
                let i = index(x, y);
                let n = neighbours(x, y);
                NEXT[i] = match (CELLS[i], n) {
                    (1, 2) | (1, 3) => 1, // survives
                    (0, 3) => 1,          // born
                    _ => 0,               // dies or stays dead
                };
            }
        }
        CELLS = NEXT;
    }
}

#[no_mangle]
pub extern "C" fn set(x: usize, y: usize, alive: u8) {
    if x < WIDTH && y < HEIGHT {
        unsafe { CELLS[index(x, y)] = alive }
    }
}

#[no_mangle]
pub extern "C" fn toggle(x: usize, y: usize) {
    if x < WIDTH && y < HEIGHT {
        unsafe { CELLS[index(x, y)] ^= 1 }
    }
}

#[no_mangle]
pub extern "C" fn clear() {
    unsafe { CELLS = [0; WIDTH * HEIGHT] }
}
