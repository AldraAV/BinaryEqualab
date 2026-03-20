cmake_minimum_required(VERSION 3.20)

# Test executable — all tests in one binary
add_executable(binary-tests
    test_all.cpp
)

target_link_libraries(binary-tests binary-core)
target_include_directories(binary-tests PRIVATE ${CMAKE_SOURCE_DIR}/include)

add_test(NAME BinaryTests COMMAND binary-tests)
