<fieldset class="switcher">
  <legend class="switcher__legend">Choose theme</legend>
  <label class="switcher__option">
    <input class="switcher__input" type="radio" name="page" value="home" c-option="1" checked/>
   home svg
  </label>
  <label class="switcher__option">
    <input class="switcher__input" type="radio" name="page" value="vehicles" c-option="2" />
    vehicle svg
  </label>
  <label class="switcher__option">
    <input class="switcher__input" type="radio" name="page" value="staff" c-option="3" />
    staff svg
  </label>
</fieldset>


.switcher {
  position: fixed;
  z-index: 1;
  top: 40px;
  left: 50%;
  translate: -50%;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 244px;
  max-width: 244px;
  height: 70px;
  box-sizing: border-box;
  padding: 8px 12px 10px;
  margin: 0 auto;
  border: none;
  border-radius: 99em;
  font-size: var(--fz);
  background-color: color-mix(in srgb, var(--c-glass) 12%, transparent);
  backdrop-filter: blur(8px) url(#switcher) saturate(var(--saturation));
  -webkit-backdrop-filter: blur(8px) saturate(var(--saturation));
  box-shadow: 
    inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
    inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent), 
    inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent), 
    inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent), 
    inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent), 
    inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent), 
    inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent), 
    inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent), 
    0px 1px 5px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent), 
    0px 6px 16px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent);
  transition: 
    background-color 400ms 
      cubic-bezier(1, 0.0, 0.4, 1),
    box-shadow 400ms
      cubic-bezier(1, 0.0, 0.4, 1);
}

.switcher__legend {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  border: 0;
  padding: 0;
  white-space: nowrap;
  clip-path: inset(100%);
  clip: rect(0 0 0 0);
  overflow: hidden;
}

.switcher__input {
  clip: rect(0 0 0 0);
  clip-path: inset(100%);
  height: 1px;
  width: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}

.switcher__icon {
  display: block;
  width: 100%;
  transition: scale 200ms cubic-bezier(0.5, 0, 0, 1);
}

.switcher__filter {
  position: absolute;
  width: 0;
  height: 0;
  z-index: -1;
}

.switcher__option {
  --c: var(--c-content);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  width: 68px;
  height: 100%;
  box-sizing: border-box;
  border-radius: 99em;
  opacity: 1;
  transition: all 160ms;
}

.switcher__option:hover {
  --c: var(--c-action);
  cursor: pointer;
}

.switcher__option:hover .switcher__icon {
  scale: 1.2;
}

.switcher__option:has(input:checked) {
  --c: var(--c-content);
  cursor: auto;
}

.switcher__option:has(input:checked) .switcher__icon {
  scale: 1;
}

.switcher::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 4px;
  display: block;
  width: 84px;
  height: calc(100% - 10px);
  border-radius: 99em;
  background-color: color-mix(in srgb, var(--c-glass) 36%, transparent);
  z-index: -1;
  box-shadow: 
    inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
    inset 2px 1px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent), 
    inset -1.5px -1px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent), 
    inset -2px -6px 1px -5px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent), 
    inset -1px 2px 3px -1px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent), 
    inset 0px -4px 1px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent), 
    0px 3px 6px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent);
}

.switcher:has(input[c-option="1"]:checked)::after {
  translate: 0 0;
  transform-origin: right;
  transition: 
    background-color 400ms 
      cubic-bezier(1, 0.0, 0.4, 1),
    box-shadow 400ms
      cubic-bezier(1, 0.0, 0.4, 1),
    translate 400ms 
      cubic-bezier(1, 0.0, 0.4, 1);
  animation: scaleToggle 440ms ease; 
}

.switcher:has(input[c-option="2"]:checked)::after {
  translate: 76px 0;
  transition: 
    background-color 400ms 
      cubic-bezier(1, 0.0, 0.4, 1),
    box-shadow 400ms
      cubic-bezier(1, 0.0, 0.4, 1),
    translate 400ms 
      cubic-bezier(1, 0.0, 0.4, 1);
  animation: scaleToggle2 440ms ease; 
}

.switcher[c-previous="1"]:has(input[c-option="2"]:checked)::after {
  transform-origin: left;
}

.switcher[c-previous="3"]:has(input[c-option="2"]:checked)::after {
  transform-origin: right;
}

.switcher:has(input[c-option="3"]:checked)::after {
  translate: 152px 0;
  transform-origin: left;
  transition: 
    background-color 400ms 
      cubic-bezier(1, 0.0, 0.4, 1),
    box-shadow 400ms
      cubic-bezier(1, 0.0, 0.4, 1),
    translate 400ms 
      cubic-bezier(1, 0.0, 0.4, 1);
  animation: scaleToggle3 440ms ease; 
}


@keyframes scaleToggle {
  0% { scale: 1 1; }
  50% { scale: 1.1 1; }
  100% { scale: 1 1; }
}

@keyframes scaleToggle2{
  0% { scale: 1 1; }
  50% { scale: 1.2 1; }
  100% { scale: 1 1; }
} 

@keyframes scaleToggle3 {
  0% { scale: 1 1; }
  50% { scale: 1.1 1; }
  100% { scale: 1 1; }
}



const switcher = document.querySelector('.switcher');

const trackPrevious = (el) => {
  const radios = el.querySelectorAll('input[type="radio"]');
  let previousValue = null;

  // Найти уже выбранный radio при инициализации
  const initiallyChecked = el.querySelector('input[type="radio"]:checked');
  if (initiallyChecked) {
    previousValue = initiallyChecked.getAttribute("c-option");
    el.setAttribute('c-previous', previousValue);
  }

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        el.setAttribute('c-previous', previousValue ?? '');
        previousValue = radio.getAttribute("c-option");
      }
    });
  });
}



trackPrevious(switcher);