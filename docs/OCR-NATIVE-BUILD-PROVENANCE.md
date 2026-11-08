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

## Mission 33 notice inventory

Each row covers the exact build input above. The revisions are authoritative where the upstream release number is unavailable. The upstream files were retrieved and hashed. The source recipes and artifact identities establish build inputs. They do not establish the final linked object set for each binary.

| Input | Version or pin | Notice classification | Packaging review |
| --- | --- | --- | --- |
| giflib | Pinned commit | MIT-style | Retain copyright and permission notice. |
| leptonica | Pinned commit | BSD-style | Retain license and binary notices. |
| libjpeg | 9a, pinned commit | IJG license | Review attribution, source-change notices and documentation requirements. |
| libpng | Pinned commit | PNG Reference Library License v2 | Retain notices and mark modified source where applicable. |
| libtiff | Pinned commit | Sam Leffler / Silicon Graphics permissive notice | Retain copyright and permission text and review name-use terms. |
| libwebp | Pinned commit | BSD-style and separate patent grant | Review both COPYING and PATENTS. |
| openlibm | Pinned commit | Multiple per-source licenses | Map notices to linked source files. |
| tesseract | Pinned fork commit | Apache-2.0 | Check upstream NOTICE and fork changes, and retain applicable notices. |
| zlib | 1.2.12, pinned commit | zlib license | Preserve source notice and review altered-source marking. |
| Emscripten | 3.1.38 | MIT or NCSA for Emscripten itself | Enumerate runtime and sysroot components separately, including notices for code linked into the WASM. |

### Verified notice sources

Each checksum applies to the upstream text at the linked revision.
- emscripten [LICENSE](https://raw.githubusercontent.com/emscripten-core/emscripten/3.1.38/LICENSE), SHA-256 `620a78084fc7ca97c0b5dea9abf891f3ffcadfdbf305276f099c9c4e12fc1d86`.
- giflib [COPYING](https://raw.githubusercontent.com/mirrorer/giflib/fa37672085ce4b3d62c51627ab3c8cf2dda8009a/COPYING), SHA-256 `0c9b7990ecdca88b676db232c226548ac408b279f550d424d996f0d83591dd8e`.
- leptonica [leptonica-license.txt](https://raw.githubusercontent.com/DanBloomberg/leptonica/4af068b56a9674da915debea4ed7e1b9885b17e8/leptonica-license.txt), SHA-256 `87829abb5bbb00b55a107365da89e9a33f86c4250169e5a1e5588505be7d5806`.
- libjpeg [README](https://raw.githubusercontent.com/LuaDist/libjpeg/6c0fcb8ddee365e7abc4d332662b06900612e923/README), SHA-256 `c791da525733040e622ed257c7b096b8f5191b332604ead0c6bc2b54cbd8e0d1`.
- libpng [LICENSE](https://raw.githubusercontent.com/glennrp/libpng/a37d4836519517bdce6cb9d956092321eca3e73b/LICENSE), SHA-256 `33ba4e187d8b0c8d7ab2bc2e522bb095219e03089e9aa0122b4fb9eb2b7de82b`.
- libtiff [COPYRIGHT](https://raw.githubusercontent.com/libsdl-org/libtiff/b51bb157123264e26d34c09cc673d213aea61fc7/COPYRIGHT), SHA-256 `fbd6fed7938541d2c809c0826225fc85e551fdbfa8732b10f0c87e0847acafd7`.
- libwebp [COPYING](https://raw.githubusercontent.com/webmproject/libwebp/20ef03ee351d4ff03fc5ff3ec4804a879d1b9d5c/COPYING), SHA-256 `5aec868f669e384a22372a4e8a1a6cd7d44c64cd451f960ca69cc170d1e13acf`.
- libwebp [PATENTS](https://raw.githubusercontent.com/webmproject/libwebp/20ef03ee351d4ff03fc5ff3ec4804a879d1b9d5c/PATENTS), SHA-256 `cc3273e0694ea5896145e0677699b53471b03ea43021ddc50e7923fbb9f5023c`.
- openlibm [LICENSE.md](https://raw.githubusercontent.com/JuliaMath/openlibm/ae2d91698508701c83cab83714d42a1146dccf85/LICENSE.md), SHA-256 `b1843fbf5b03f519a5f0a44fce751bdd1022ae7148614923f9d6293e17a18b17`.
- tesseract [LICENSE](https://raw.githubusercontent.com/Balearica/tesseract/e20b1c6553c8f68c4bbff1feef0a64064959a427/LICENSE), SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`.
- zlib [README](https://raw.githubusercontent.com/madler/zlib/21767c654d31d2dccdde4330529775c6c5fd5389/README), SHA-256 `fc2c3368901700f0acdeb1d8afeaca5923296768ec6824ecdf627aac396001fd`.

Release remains blocked pending per-variant link maps or a reproducible rebuild, the toolchain/sysroot inventory, final notice packaging, and redistribution approval. The pinned libtiff notice was retrieved from the GitHub mirror at the build recipe's commit. The zlib notice is carried in README at that pin.

## Mission 34 packaged notices and binary evidence

`npm run prepare:ocr` now includes the 11 pinned texts and their checksum index under `licenses/native/`. Preparation fails before publication on missing, substituted or altered notice files. Generated output verification also checks the notices on reuse.

Run `node scripts/audit-ocr-binaries.mjs` to reproduce [the four-variant evidence](OCR-BINARY-EVIDENCE.json). It verifies that every original section other than memory is byte-identical after deriving the hardened cores and that the added custom section contains the modification notice. It also records import/export counts and diagnostic strings. A diagnostic string can identify a useful lead but cannot establish linker retention, exact dependency versions or completeness. The stripped release files do not contain a linker map. Per-object link evidence, the sysroot inventory and final redistribution sign-off remain release gates.
