// Native dialogs share keyboard, backdrop and focus-return behavior on every page.
const triggers = new Map<HTMLDialogElement, HTMLElement>();
document.querySelectorAll<HTMLElement>('[data-open-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.openDialog!);
    if (!(dialog instanceof HTMLDialogElement)) return;
    triggers.set(dialog, button);
    button.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('.dialog-close')?.focus();
  });
});
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll<HTMLElement>('a[href], button, input, textarea, select, summary, [tabindex]')]
      .filter((el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0);
    if (!controls.length) return;
    // Include links even when macOS native Tab preferences skip them.
    const current = controls.indexOf(document.activeElement as HTMLElement);
    const next = current < 0 ? 0 : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    event.preventDefault(); controls[next].focus();
  });
  dialog.addEventListener('close', () => {
    const trigger = triggers.get(dialog);
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.focus({ preventScroll: true });
  });
});
