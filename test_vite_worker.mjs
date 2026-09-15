import { build } from 'vite';
import fs from 'fs';

(async () => {
  try {
    fs.writeFileSync('test_worker_plugin.js', `
      import { pdfjs } from 'react-pdf';
      import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
      console.log(workerUrl);
    `);
    
    await build({
      root: '.',
      build: {
        lib: { entry: 'test_worker_plugin.js', formats: ['es'] },
        outDir: 'dist_test_worker',
        emptyOutDir: true,
      }
    });
    console.log('Build success!');
  } catch(e) {
    console.error(e);
  }
})();
