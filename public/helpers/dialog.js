const openBtns = document.querySelectorAll('.dialog-open-btn');
const closeBtns = document.querySelectorAll('.dialog-close');
openBtns.forEach((btn) => {
  const id = btn.dataset.open;
  const dialog = document.querySelector(`.dialog-${id}`);
  btn.addEventListener('click', () => dialog.showModal());
});
closeBtns.forEach((btn) => {
  const id = btn.dataset.close;
  const dialog = document.querySelector(`.dialog-${id}`);
  btn.addEventListener('click', () => {
    document.querySelector(`#password-${id}`).value = '';
    dialog.close();
  });
});
