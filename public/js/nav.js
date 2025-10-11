// Navigation
const pages = document.querySelectorAll('.page');
document.getElementById('nav').addEventListener('click', (e) => {
  const link = e.target.closest('[data-target]');
  if (!link) return;
  e.preventDefault();
  const target = link.dataset.target;
  pages.forEach(p => p.classList.toggle('active', p.id === target));
  document.querySelectorAll('#nav .nav-link').forEach(a => a.classList.remove('active'));
  link.classList.add('active');
})