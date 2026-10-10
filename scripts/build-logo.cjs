const fs = require('fs');
const { Jimp } = require('jimp');

async function processImages() {
  const srcValidJpg = 'src/assets/images/logo_new_1784569195706.jpg';
  
  // 1. Direct binary copy to src/assets/images/logo.jpg and public/logo.jpg
  fs.copyFileSync(srcValidJpg, 'src/assets/images/logo.jpg');
  fs.copyFileSync(srcValidJpg, 'public/logo.jpg');
  console.log('Copied valid JPEG binary to src/assets/images/logo.jpg & public/logo.jpg');

  // 2. Read with Jimp to generate real PNGs of various sizes
  const img = await Jimp.read(srcValidJpg);
  
  // 512x512 PNG
  const img512 = img.clone().resize({ w: 512, h: 512 });
  await img512.write('public/logo.png');
  await img512.write('public/icon-512.png');
  await img512.write('public/apple-touch-icon.png');
  console.log('Generated 512x512 PNGs');

  // 192x192 PNG
  const img192 = img.clone().resize({ w: 192, h: 192 });
  await img192.write('public/icon-192.png');
  console.log('Generated 192x192 PNG');

  // 256x256 base64 for fallback
  const img256 = img.clone().resize({ w: 256, h: 256 });
  const buffer256 = await img256.getBuffer('image/png');
  const base64Png = 'data:image/png;base64,' + buffer256.toString('base64');
  
  const bufferJpg = await img256.getBuffer('image/jpeg');
  const base64Jpg = 'data:image/jpeg;base64,' + bufferJpg.toString('base64');

  const fileContent = `// Auto-generated permanent embedded logo fallback\nexport const EMBEDDED_LOGO_PNG = "${base64Png}";\nexport const EMBEDDED_LOGO_JPG = "${base64Jpg}";\n`;
  fs.writeFileSync('src/lib/logoData.ts', fileContent);
  console.log('Generated src/lib/logoData.ts with clean base64 string');
}

processImages().then(() => console.log('Done!')).catch(console.error);
