import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function srgbTransferFunction(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
}

export function oklabToRgb(str: string): string {
  try {
    const inner = str.replace(/^oklab\(/i, '').replace(/\)$/, '').trim();
    const [colorPart, alphaPart] = inner.split('/');
    const parts = colorPart.trim().split(/[\s,]+/);
    if (parts.length < 3) return 'rgb(15, 118, 110)';

    let L = parseFloat(parts[0]);
    if (parts[0].includes('%')) L = L / 100;

    let a = parseFloat(parts[1]);
    if (parts[1].includes('%')) a = (a / 100) * 0.4;

    let b = parseFloat(parts[2]);
    if (parts[2].includes('%')) b = (b / 100) * 0.4;

    let alpha = 1;
    if (alphaPart) {
      const parsedAlpha = parseFloat(alphaPart.trim());
      if (!isNaN(parsedAlpha)) {
        alpha = alphaPart.includes('%') ? parsedAlpha / 100 : parsedAlpha;
      }
    } else if (parts.length >= 4) {
      const parsedAlpha = parseFloat(parts[3]);
      if (!isNaN(parsedAlpha)) {
        alpha = parts[3].includes('%') ? parsedAlpha / 100 : parsedAlpha;
      }
    }

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855414 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b_val = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const r255 = Math.round(Math.max(0, Math.min(255, srgbTransferFunction(r) * 255)));
    const g255 = Math.round(Math.max(0, Math.min(255, srgbTransferFunction(g) * 255)));
    const b255 = Math.round(Math.max(0, Math.min(255, srgbTransferFunction(b_val) * 255)));

    if (alpha < 1) {
      return `rgba(${r255}, ${g255}, ${b255}, ${Math.max(0, Math.min(1, alpha))})`;
    }
    return `rgb(${r255}, ${g255}, ${b255})`;
  } catch {
    return 'rgb(15, 118, 110)';
  }
}

export function oklchToRgb(str: string): string {
  try {
    const inner = str.replace(/^oklch\(/i, '').replace(/\)$/, '').trim();
    const [colorPart, alphaPart] = inner.split('/');
    const parts = colorPart.trim().split(/[\s,]+/);
    if (parts.length < 3) return 'rgb(15, 118, 110)';

    let L = parseFloat(parts[0]);
    if (parts[0].includes('%')) L = L / 100;

    let C = parseFloat(parts[1]);
    if (parts[1].includes('%')) C = (C / 100) * 0.4;

    let H = parseFloat(parts[2]);
    if (parts[2].includes('rad')) H = parseFloat(parts[2]) * (180 / Math.PI);
    else if (parts[2].includes('grad')) H = parseFloat(parts[2]) * 0.9;
    else if (parts[2].includes('turn')) H = parseFloat(parts[2]) * 360;
    else if (parts[2].includes('deg')) H = parseFloat(parts[2].replace('deg', ''));

    let alpha = 1;
    if (alphaPart) {
      const parsedAlpha = parseFloat(alphaPart.trim());
      if (!isNaN(parsedAlpha)) {
        alpha = alphaPart.includes('%') ? parsedAlpha / 100 : parsedAlpha;
      }
    } else if (parts.length >= 4) {
      const parsedAlpha = parseFloat(parts[3]);
      if (!isNaN(parsedAlpha)) {
        alpha = parts[3].includes('%') ? parsedAlpha / 100 : parsedAlpha;
      }
    }

    const hRad = (isNaN(H) ? 0 : H) * Math.PI / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855414 * b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b_val = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const r255 = Math.round(Math.max(0, Math.min(255, srgbTransferFunction(r) * 255)));
    const g255 = Math.round(Math.max(0, Math.min(255, srgbTransferFunction(g) * 255)));
    const b255 = Math.round(Math.max(0, Math.min(255, srgbTransferFunction(b_val) * 255)));

    if (alpha < 1) {
      return `rgba(${r255}, ${g255}, ${b255}, ${Math.max(0, Math.min(1, alpha))})`;
    }
    return `rgb(${r255}, ${g255}, ${b255})`;
  } catch {
    return 'rgb(15, 118, 110)';
  }
}

/**
 * Replaces function calls with balanced parentheses safely
 */
export function replaceColorFunction(cssText: string, funcName: string, converter: (match: string) => string): string {
  const target = funcName.toLowerCase() + '(';
  if (!cssText.toLowerCase().includes(target)) return cssText;

  let result = '';
  let i = 0;

  while (i < cssText.length) {
    const idx = cssText.toLowerCase().indexOf(target, i);
    if (idx === -1) {
      result += cssText.slice(i);
      break;
    }

    result += cssText.slice(i, idx);
    let depth = 1;
    let j = idx + target.length;

    while (j < cssText.length && depth > 0) {
      if (cssText[j] === '(') depth++;
      else if (cssText[j] === ')') depth--;
      j++;
    }

    const fullMatch = cssText.slice(idx, j);
    try {
      result += converter(fullMatch);
    } catch {
      result += 'rgb(15, 118, 110)';
    }
    i = j;
  }

  return result;
}

function computeBrowserColor(cssExpr: string): string {
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillStyle = cssExpr;
        const style = ctx.fillStyle;
        if (style && style !== 'rgba(0,0,0,0)') {
          return style;
        }
      }
      const span = document.createElement('span');
      span.style.color = cssExpr;
      span.style.display = 'none';
      document.body.appendChild(span);
      const computed = window.getComputedStyle(span).color;
      document.body.removeChild(span);
      if (computed && !computed.includes('color-mix') && !computed.includes('oklab') && !computed.includes('oklch')) {
        return computed;
      }
    }
  } catch {}
  return 'rgba(0, 0, 0, 0)';
}

export function convertCssColors(val: string): string {
  if (typeof val !== 'string') return val;
  const lower = val.toLowerCase();
  if (
    !lower.includes('oklch(') &&
    !lower.includes('oklab(') &&
    !lower.includes('color(') &&
    !lower.includes('color-mix(') &&
    !lower.includes('light-dark(') &&
    !lower.includes('lab(') &&
    !lower.includes('lch(') &&
    !lower.includes('hwb(')
  ) {
    return val;
  }

  let result = val;
  if (result.toLowerCase().includes('oklch(')) {
    result = replaceColorFunction(result, 'oklch', oklchToRgb);
  }
  if (result.toLowerCase().includes('oklab(')) {
    result = replaceColorFunction(result, 'oklab', oklabToRgb);
  }
  if (result.toLowerCase().includes('color-mix(')) {
    result = replaceColorFunction(result, 'color-mix', (match) => computeBrowserColor(match));
  }
  if (result.toLowerCase().includes('light-dark(')) {
    result = replaceColorFunction(result, 'light-dark', (match) => {
      const parts = match.replace(/^light-dark\(/i, '').replace(/\)$/, '').split(',');
      const selected = parts[0]?.trim();
      return selected ? computeBrowserColor(selected) : 'rgba(0, 0, 0, 0)';
    });
  }
  if (result.toLowerCase().includes('color(')) {
    result = replaceColorFunction(result, 'color', (match) => computeBrowserColor(match));
  }
  if (result.toLowerCase().includes('lab(')) {
    result = replaceColorFunction(result, 'lab', (match) => computeBrowserColor(match));
  }
  if (result.toLowerCase().includes('lch(')) {
    result = replaceColorFunction(result, 'lch', (match) => computeBrowserColor(match));
  }
  if (result.toLowerCase().includes('hwb(')) {
    result = replaceColorFunction(result, 'hwb', (match) => computeBrowserColor(match));
  }

  return result;
}

const COLOR_STYLE_PROPS = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'fill',
  'stroke',
  'boxShadow',
  'textShadow',
  'caretColor'
];

/**
 * Patches getComputedStyle, getPropertyValue, and CSSStyleDeclaration getters globally on the given window
 */
export function patchGetComputedStyle(win: any): () => void {
  if (!win) return () => {};

  const originalGetComputedStyle = win.getComputedStyle;
  const proto = win.CSSStyleDeclaration?.prototype;
  const originalGetPropertyValue = proto?.getPropertyValue;

  // 1. Patch prototype.getPropertyValue
  if (proto && originalGetPropertyValue) {
    proto.getPropertyValue = function (propertyName: string) {
      const val = originalGetPropertyValue.call(this, propertyName);
      if (typeof val === 'string') {
        return convertCssColors(val);
      }
      return val;
    };
  }

  // 2. Patch prototype getters for color properties
  const originalDescriptors: Record<string, PropertyDescriptor | undefined> = {};
  if (proto) {
    COLOR_STYLE_PROPS.forEach((prop) => {
      try {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (desc && desc.get) {
          originalDescriptors[prop] = desc;
          Object.defineProperty(proto, prop, {
            get() {
              const val = desc.get!.call(this);
              return typeof val === 'string' ? convertCssColors(val) : val;
            },
            set: desc.set ? function (v) { desc.set!.call(this, v); } : undefined,
            configurable: true,
            enumerable: desc.enumerable
          });
        }
      } catch (e) {
        // ignore non-configurable properties
      }
    });
  }

  // 3. Patch window.getComputedStyle
  if (originalGetComputedStyle) {
    win.getComputedStyle = function (el: Element, pseudoElt?: string) {
      const style = originalGetComputedStyle.call(this, el, pseudoElt);
      if (!style) return style;

      return new Proxy(style, {
        get(target: any, prop: string | symbol) {
          const val = target[prop];
          if (typeof val === 'string') {
            return convertCssColors(val);
          }
          if (typeof val === 'function') {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const originalVal = target.getPropertyValue(propertyName);
                if (typeof originalVal === 'string') {
                  return convertCssColors(originalVal);
                }
                return originalVal;
              };
            }
            return val.bind(target);
          }
          return val;
        }
      });
    };
  }

  return () => {
    if (originalGetComputedStyle) {
      win.getComputedStyle = originalGetComputedStyle;
    }
    if (proto && originalGetPropertyValue) {
      proto.getPropertyValue = originalGetPropertyValue;
    }
    if (proto) {
      Object.entries(originalDescriptors).forEach(([prop, desc]) => {
        if (desc) {
          try {
            Object.defineProperty(proto, prop, desc);
          } catch (e) {}
        }
      });
    }
  };
}

/**
 * Sanitizes all style tags and style attributes in Document
 */
export function sanitizeStylesInDoc(doc: Document) {
  try {
    const styleElements = Array.from(doc.querySelectorAll('style'));
    for (const style of styleElements) {
      const text = style.textContent || '';
      if (
        text.includes('oklch') ||
        text.includes('oklab') ||
        text.includes('color(') ||
        text.includes('color-mix') ||
        text.includes('light-dark') ||
        text.includes('lab(') ||
        text.includes('lch(')
      ) {
        style.textContent = convertCssColors(text);
      }
    }
  } catch (e) {
    console.warn('Style sanitization warning:', e);
  }
}

/**
 * Inlines safe computed colors on element and its descendants
 */
export function inlineSafeColors(rootEl: HTMLElement) {
  try {
    const allEls = [rootEl, ...Array.from(rootEl.querySelectorAll('*'))] as HTMLElement[];
    for (const el of allEls) {
      if (el.style) {
        const inlineCss = el.getAttribute('style');
        if (
          inlineCss &&
          (inlineCss.includes('oklab') ||
            inlineCss.includes('oklch') ||
            inlineCss.includes('color(') ||
            inlineCss.includes('color-mix') ||
            inlineCss.includes('light-dark') ||
            inlineCss.includes('lab(') ||
            inlineCss.includes('lch('))
        ) {
          el.setAttribute('style', convertCssColors(inlineCss));
        }

        const computed = window.getComputedStyle(el);
        if (computed) {
          COLOR_STYLE_PROPS.forEach((prop) => {
            const val = (computed as any)[prop];
            if (
              typeof val === 'string' &&
              (val.includes('oklab') ||
                val.includes('oklch') ||
                val.includes('color(') ||
                val.includes('color-mix') ||
                val.includes('light-dark') ||
                val.includes('lab(') ||
                val.includes('lch('))
            ) {
              (el.style as any)[prop] = convertCssColors(val);
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('Inline color sanitization warning:', e);
  }
}

/**
 * Safe canvas renderer that guarantees crisp capture of any element (even hidden/offscreen ones)
 */
export async function renderSafeCanvas(
  targetElement: HTMLElement,
  options: any = {}
): Promise<HTMLCanvasElement> {
  // 1. Sanitize styles in main document
  sanitizeStylesInDoc(document);

  // 2. Patch window and CSSStyleDeclaration prototype
  const restoreWindow = patchGetComputedStyle(window);

  let stageContainer: HTMLDivElement | null = null;
  let elementToRender = targetElement;

  try {
    // Check if element is hidden or detached or has 0 dimensions
    const rect = targetElement.getBoundingClientRect();
    const isHiddenOrEmpty = rect.width === 0 || rect.height === 0 || window.getComputedStyle(targetElement).display === 'none';

    if (isHiddenOrEmpty || options.forceClone) {
      // Create an invisible, properly dimensioned staging container at top of document
      stageContainer = document.createElement('div');
      stageContainer.style.position = 'fixed';
      stageContainer.style.top = '0';
      stageContainer.style.left = '0';
      stageContainer.style.width = options.width ? `${options.width}px` : '840px';
      stageContainer.style.zIndex = '-99999';
      stageContainer.style.opacity = '0';
      stageContainer.style.pointerEvents = 'none';
      stageContainer.style.overflow = 'visible';
      stageContainer.style.backgroundColor = options.backgroundColor || '#ffffff';

      const clone = targetElement.cloneNode(true) as HTMLElement;
      clone.style.display = 'block';
      clone.style.visibility = 'visible';
      clone.style.position = 'relative';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.width = '100%';
      clone.style.margin = '0';
      clone.style.boxSizing = 'border-box';
      clone.className = (clone.className || '').replace(/\bhidden\b/g, '').replace(/\bprint:block\b/g, '');

      // Remove display:none from any child wrappers
      const hiddenChildren = Array.from(clone.querySelectorAll('.hidden'));
      hiddenChildren.forEach((child) => {
        (child as HTMLElement).classList.remove('hidden');
        (child as HTMLElement).style.display = 'block';
      });

      stageContainer.appendChild(clone);
      document.body.appendChild(stageContainer);
      elementToRender = clone;

      // Allow microtask/frame for layout calculation
      await new Promise((r) => setTimeout(r, 60));
    }

    // 3. Inline safe colors on the element tree
    inlineSafeColors(elementToRender);

    const html2canvasFn = (html2canvas as any).default || html2canvas;
    const customOnClone = options.onclone;

    const mergedOptions = {
      scale: 2.2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      ...options,
      onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
        if (clonedDoc.defaultView) {
          patchGetComputedStyle(clonedDoc.defaultView);
        }
        sanitizeStylesInDoc(clonedDoc);
        inlineSafeColors(clonedEl);

        // Inject global table text elevation styles for PDF/Canvas export
        try {
          const styleEl = clonedDoc.createElement('style');
          styleEl.textContent = `
            table { border-collapse: collapse !important; }
            table th, table td {
              vertical-align: middle !important;
              padding-top: 2px !important;
              padding-bottom: 5px !important;
              line-height: 1.25 !important;
            }
            table th span, table td span, table th p, table td p {
              display: inline-block !important;
              vertical-align: middle !important;
              line-height: 1.25 !important;
            }
          `;
          clonedDoc.head.appendChild(styleEl);
        } catch (e) {}

        // Ensure cloned element is visible and positioned normally
        clonedEl.style.display = 'block';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.position = 'relative';
        clonedEl.style.left = '0';
        clonedEl.style.top = '0';

        if (customOnClone) {
          customOnClone(clonedDoc, clonedEl);
        }
      }
    };

    const canvas = await html2canvasFn(elementToRender, mergedOptions);
    return canvas;
  } finally {
    if (stageContainer && stageContainer.parentNode) {
      stageContainer.parentNode.removeChild(stageContainer);
    }
    restoreWindow();
  }
}

/**
 * Downloads a canvas directly as a PNG or JPG file
 */
export function downloadCanvasAsImage(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.95
) {
  try {
    const dataUrl = canvas.toDataURL(format, quality);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 100);
  } catch (err) {
    console.error('Error saving image file:', err);
    throw err;
  }
}

/**
 * Exports any HTML element directly to a beautifully formatted PDF document
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: {
    fileName: string;
    format?: 'a4' | 'a5';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
    scale?: number;
    width?: number;
    backgroundColor?: string;
  }
) {
  const orientation = options.orientation || 'portrait';
  const format = options.format || 'a4';
  const margin = options.margin !== undefined ? options.margin : 6;
  const scale = options.scale || 2.5;

  const canvas = await renderSafeCanvas(element, {
    scale,
    backgroundColor: options.backgroundColor || '#ffffff',
    width: options.width || (format === 'a5' ? 600 : 840),
    forceClone: true
  });

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = orientation === 'portrait' ? (format === 'a5' ? 148 : 210) : (format === 'a5' ? 210 : 297);
  const pageHeight = orientation === 'portrait' ? (format === 'a5' ? 210 : 297) : (format === 'a5' ? 148 : 210);

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  if (imgHeight <= usableHeight) {
    // Single page centered vertically if needed
    const yOffset = margin + (usableHeight - imgHeight) / 2;
    pdf.addImage(imgData, 'JPEG', margin, yOffset, imgWidth, imgHeight);
  } else {
    // Multi-page document
    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }
  }

  pdf.save(options.fileName);
}

export async function exportElementToJpg(
  element: HTMLElement,
  options: {
    fileName: string;
    quality?: number;
    scale?: number;
    width?: number;
    backgroundColor?: string;
  }
) {
  const scale = options.scale || 3;
  const canvas = await renderSafeCanvas(element, {
    scale,
    backgroundColor: options.backgroundColor || '#ffffff',
    width: options.width,
    forceClone: true
  });

  const quality = options.quality !== undefined ? options.quality : 0.96;
  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const finalName = options.fileName.toLowerCase().endsWith('.jpg') || options.fileName.toLowerCase().endsWith('.jpeg')
    ? options.fileName
    : `${options.fileName}.jpg`;

  const link = document.createElement('a');
  link.download = finalName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

