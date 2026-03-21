export function resetSize(vm: any) {
  let img_width: string
  let img_height: string
  let bar_width: string
  let bar_height: string

  const parentWidth = vm.$el.parentNode?.offsetWidth || (window as any).offsetWidth
  const parentHeight = vm.$el.parentNode?.offsetHeight || (window as any).offsetHeight

  if (vm.imgSize.width.includes('%')) {
    img_width = `${Number.parseInt(vm.imgSize.width) / 100 * parentWidth}px`
  }
  else {
    img_width = vm.imgSize.width
  }

  if (vm.imgSize.height.includes('%')) {
    img_height = `${Number.parseInt(vm.imgSize.height) / 100 * parentHeight}px`
  }
  else {
    img_height = vm.imgSize.height
  }

  if (vm.barSize.width.includes('%')) {
    bar_width = `${Number.parseInt(vm.barSize.width) / 100 * parentWidth}px`
  }
  else {
    bar_width = vm.barSize.width
  }

  if (vm.barSize.height.includes('%')) {
    bar_height = `${Number.parseInt(vm.barSize.height) / 100 * parentHeight}px`
  }
  else {
    bar_height = vm.barSize.height
  }

  return {
    imgWidth: img_width,
    imgHeight: img_height,
    barWidth: bar_width,
    barHeight: bar_height,
  }
}

export const _code_chars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
export const _code_color1 = ['#fffff0', '#f0ffff', '#f0fff0', '#fff0f0']
export const _code_color2 = ['#FF0033', '#006699', '#993366', '#FF9900', '#66CC66', '#FF33CC']
