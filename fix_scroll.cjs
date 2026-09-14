const fs = require('fs');
let content = fs.readFileSync('src/components/NativePdfReader.tsx', 'utf8');

// Add an observer ref
const observerHook = `
  const pageRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  
  useEffect(() => {
    if (settings.layoutMode !== 'scroll' || numPages === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          const page = Number(entry.target.getAttribute('data-page-number'));
          if (page && !isNaN(page)) {
            setPageNumber(page);
          }
        }
      });
    }, { threshold: 0.3, root: containerRef.current });

    Object.values(pageRefs.current).forEach(node => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [settings.layoutMode, numPages, scale]);
`;

content = content.replace('  const [pdfFilterTheme, setPdfFilterTheme] = useState<\'light\' | \'dark\' | \'sepia\'>(\'light\');', '  const [pdfFilterTheme, setPdfFilterTheme] = useState<\'light\' | \'dark\' | \'sepia\'>(\'light\');\n' + observerHook);

const oldScroll = `                {settings.layoutMode === 'scroll' ? (
                  // Continuous Scroll Rendering
                  <div className="flex flex-col gap-6 items-center w-full max-w-full">
                    {Array.from(new Array(numPages), (el, index) => (
                      <div key={\`page_\${index + 1}\`} className="shadow-xl max-w-full overflow-hidden bg-white">
                        <Page suspense={false} customTextRenderer={makeCustomTextRenderer(index + 1)}
                          pageNumber={index + 1}
                          width={pdfMaxWidth * scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </div>
                    ))}
                  </div>
                )`;

const newScroll = `                {settings.layoutMode === 'scroll' ? (
                  // Continuous Scroll Rendering
                  <div className="flex flex-col gap-6 items-center w-full max-w-full pb-20">
                    {Array.from(new Array(numPages), (el, index) => {
                      const pNum = index + 1;
                      const isVisible = Math.abs(pNum - pageNumber) <= 2;
                      return (
                        <div 
                          key={\`page_\${pNum}\`} 
                          data-page-number={pNum}
                          ref={(el) => pageRefs.current[pNum] = el as any}
                          className="shadow-xl max-w-full overflow-hidden bg-white relative flex justify-center"
                          style={{ minHeight: (pdfMaxWidth * scale) * 1.414, width: pdfMaxWidth * scale }}
                        >
                          {isVisible ? (
                            <Page suspense={false} customTextRenderer={makeCustomTextRenderer(pNum)}
                              pageNumber={pNum}
                              width={pdfMaxWidth * scale}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50/50">
                              <span className="text-xl font-medium">Page {pNum}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )`;

content = content.replace(oldScroll, newScroll);

fs.writeFileSync('src/components/NativePdfReader.tsx', content);
