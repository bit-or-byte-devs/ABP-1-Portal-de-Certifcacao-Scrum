// A navegação para a área de estudos é feita pelo link para estudos.html.
// O botão continua funcionando mesmo sem JavaScript, graças ao link HTML.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="estudos.html"]').forEach((link) => {
    link.setAttribute('aria-label', 'Iniciar estudos de Scrum');
  });
});
