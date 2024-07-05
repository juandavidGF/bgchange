export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function delay(timestep: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timestep);
  });
}