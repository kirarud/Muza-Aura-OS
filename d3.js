
const selection = {
  append: (...args) => selection,
  attr: (...args) => selection,
  call: (...args) => selection,
  selectAll: (...args) => selection,
  select: (...args) => selection,
  data: (...args) => selection,
  join: (...args) => selection,
  node: () => ({ getBoundingClientRect: () => ({ width: 800, height: 600 }) }),
  on: (...args) => selection,
  remove: () => {},
  merge: (...args) => selection,
  exit: () => selection,
  enter: () => selection,
  text: (...args) => selection,
  transition: () => selection,
  duration: (...args) => selection,
};

export const select = (...args) => selection;

const zoomBehavior = {
  scaleExtent: (...args) => zoomBehavior,
  on: (...args) => zoomBehavior,
  transform: (...args) => {},
};

export const zoom = () => zoomBehavior;

export const zoomIdentity = {
  translate: (...args) => ({ scale: (...args) => ({}) }),
};

const dragBehavior = {
  on: (...args) => dragBehavior,
};

export const drag = () => dragBehavior;
