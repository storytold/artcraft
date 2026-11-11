# boring-sys2 has built-in ARM toolchains but no RISC-V toolchain. Set the target
# explicitly so BoringSSL does not select the x86_64 runner's assembly sources.
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(OPENSSL_NO_ASM ON CACHE BOOL "Use BoringSSL's portable RISC-V implementation")
