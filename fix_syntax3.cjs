const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const regex = /\{settings\.layoutMode === 'scroll' \? \(\n\s*\/\/ Continuous Scroll Rendering\n\s*\{pdfViewMode === 'reader' \? \([\s\S]*?<\/Document>/;

content = content.replace(regex, `{settings.layoutMode === 'scroll' ? (
                // Continuous Scroll Rendering
                <div className="flex flex-col gap-6 items-center w-full max-w-full">
                  {Array.from(new Array(numPages), (el, index) => (
                    <div key={\`page_\${index + 1}\`} className={\`shadow-xl max-w-full overflow-hidden \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`}>
                      <Page suspense={false} canvasBackground="transparent" customTextRenderer={makeCustomTextRenderer(index + 1)}
                        pageNumber={index + 1}
                        width={pdfMaxWidth * scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                  ))}
                </div>
              ) : settings.layoutMode === 'double' && containerWidth > 800 ? (
                // Double Page Rendering
                <div className="flex w-full justify-center gap-1 md:gap-4 p-4 max-w-full overflow-hidden">
                  <div className={\`shadow-xl overflow-hidden flex-shrink-0 \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`} style={{ width: (pdfMaxWidth * scale) / 2 }}>
                    <Page suspense={false} canvasBackground="transparent" customTextRenderer={makeCustomTextRenderer(pageNumber)}
                      pageNumber={pageNumber}
                      width={(pdfMaxWidth * scale) / 2}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </div>
                  {pageNumber + 1 <= numPages && (
                    <div className={\`shadow-xl overflow-hidden flex-shrink-0 \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`} style={{ width: (pdfMaxWidth * scale) / 2 }}>
                      <Page suspense={false} canvasBackground="transparent" customTextRenderer={makeCustomTextRenderer(pageNumber + 1)}
                        pageNumber={pageNumber + 1}
                        width={(pdfMaxWidth * scale) / 2}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Single Page Rendering
                <div className={\`max-w-full overflow-hidden flex justify-center shadow-xl \${pdfPaperColor === 'white' ? 'bg-white' : pdfPaperColor === 'black' ? 'bg-black' : 'bg-transparent'}\`}>
                  <Page suspense={false} canvasBackground="transparent" customTextRenderer={makeCustomTextRenderer(pageNumber)}
                    pageNumber={pageNumber}
                    width={pdfMaxWidth * scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              )}
            </Document>`);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
