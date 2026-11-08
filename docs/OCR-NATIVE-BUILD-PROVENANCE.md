# OCR native build provenance

Issue #120 release evidence. Production approval remains pending.

All four standalone WASM modules in the installed `tesseract.js-core@5.1.1` npm package match the corresponding files at the peeled upstream [v5.1.1 commit](https://github.com/naptha/tesseract.js-core/tree/027867a5ab2e2e5b3736757b199b39e07706cf99), byte for byte.

| Module | Upstream and npm SHA-256 |
| --- | --- |
| `tesseract-core-lstm.wasm` | `5db58ea4d1bd4256be81e8ae3b4fa226c4625dfba1850b1b3308dbf3700e9929` |
| `tesseract-core-simd-lstm.wasm` | `66b601224a0c4a8977bc9d92dd39841189f9ca22cc4122fcd7208cdb0961eeef` |
| `tesseract-core-simd.wasm` | `baa2f54ef5af43ada4605fd7ae999bde3c6ecc96bfe0d0410b0b4f4a5f9c8b91` |
| `tesseract-core.wasm` | `b47a852b19181ae0999f9d970c368cd351135a320ea978b35bd38602d8bcc0bc` |

The tagged [build script](https://github.com/naptha/tesseract.js-core/blob/027867a5ab2e2e5b3736757b199b39e07706cf99/build.sh) builds the following [third-party gitlinks](https://github.com/naptha/tesseract.js-core/tree/027867a5ab2e2e5b3736757b199b39e07706cf99/third_party). The tagged [Docker recipe](https://github.com/naptha/tesseract.js-core/blob/027867a5ab2e2e5b3736757b199b39e07706cf99/build-with-docker.sh) names Emscripten 3.1.38.

| Source | Pinned revision |
| --- | --- |
| giflib | `fa37672085ce4b3d62c51627ab3c8cf2dda8009a` |
| leptonica | `4af068b56a9674da915debea4ed7e1b9885b17e8` |
| libjpeg | `6c0fcb8ddee365e7abc4d332662b06900612e923` |
| libpng | `a37d4836519517bdce6cb9d956092321eca3e73b` |
| libtiff | `b51bb157123264e26d34c09cc673d213aea61fc7` |
| libwebp | `20ef03ee351d4ff03fc5ff3ec4804a879d1b9d5c` |
| openlibm | `ae2d91698508701c83cab83714d42a1146dccf85` |
| tesseract | `e20b1c6553c8f68c4bbff1feef0a64064959a427` |
| zlib | `21767c654d31d2dccdde4330529775c6c5fd5389` |

These matches establish artifact identity and identify sources for notice collection. A complete embedded-component inventory still requires linker evidence or a reproducible rebuild for each variant, including the compiler runtime and any toolchain-provided libraries. Collect the license and notice text at each pinned revision and obtain redistribution approval before enabling production OCR. Keep the existing derived-core manifest, modification notice, and `productionApproved=false`.
