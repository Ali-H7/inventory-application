const deleteBtns = document.querySelectorAll('.delete-dialog-open');
const closeBtns = document.querySelectorAll('.delete-dialog-close');
deleteBtns.forEach((btn) => {
  const id = btn.dataset.delete;
  const dialog = document.querySelector(`.delete-dialog-${id}`);
  btn.addEventListener('click', () => dialog.showModal());
});
closeBtns.forEach((btn) => {
  const id = btn.dataset.close;
  const dialog = document.querySelector(`.delete-dialog-${id}`);
  btn.addEventListener('click', () => dialog.close());
});
