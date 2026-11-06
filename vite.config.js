import {defineConfig} from 'vite';
export default defineConfig({optimizeDeps:{include:['tesseract.js/dist/tesseract.esm.min.js']},server:{proxy:{'/api':{target:'http://127.0.0.1:8080',changeOrigin:false}}}});
