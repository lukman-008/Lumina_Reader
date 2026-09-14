const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

const regex = /\{pdfViewMode === 'reader' \? \([\s\S]*?<\/Document>/;

content = content.replace(regex, `{pdfViewMode === 'reader' ? (
              <div className={\`w-full h-full min-h-[60vh] overflow-y-auto px-6 py-12 flex justify-center \${themeStyle.bg}\`}>
                <div 
                  className={\`max-w-3xl w-full flex flex-col gap-6 \${settings.fontFamily} \${themeStyle.text}\`}
                  style={{
                    fontSize: \`\${settings.fontSize}px\`,
                    lineHeight: settings.lineHeight,
                    textAlign: settings.textAlign as any
                  }}
                >
                  {isExtractingText && (!extractedPageText[pageNumber]) ? (
                    <div className="flex justify-center items-center h-40 opacity-60">Extracting text...</div>
                  ) : (
                    <>
                      {extractedPageText[pageNumber]?.map((p, i) => (
                        <p key={\`p1-\${i}\`} className="indent-6">{formatBionicText(p)}</p>
                      ))}
                      {settings.layoutMode === 'double' && pageNumber + 1 <= numPages && extractedPageText[pageNumber + 1]?.map((p, i) => (
                        <p key={\`p2-\${i}\`} className="indent-6">{formatBionicText(p)}</p>
                      ))}
                      
                      {!extractedPageText[pageNumber] || extractedPageText[pageNumber].length === 0 ? (
                         <div className="flex justify-center items-center h-40 opacity-60 italic text-sm">No text found on this page. If this is a scanned document, it may be an image without a text layer.</div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : (
            <div style={{ filter: getPdfFilterStyle(), transition: 'filter 0.3s ease' }}>
            <Document suspense={false} options={pdfOptions}
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              error={
                <div className="flex justify-center items-center h-96 text-rose-500">
                  <p>Failed to load native PDF. The file may be corrupted.</p>
                </div>
              }
            >
              {settings.layoutMode === 'scroll' ? (
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
            </Document>
            </div>
            )}`);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
