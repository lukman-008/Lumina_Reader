const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log(entry.target.getAttribute('data-page-number'));
    }
  });
}, { threshold: 0.5 });
