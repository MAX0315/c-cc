const { Jimp } = require('jimp');

async function analyze() {
    const img = await Jimp.read('C:/c-cc/temp_image.jpg');
    const width = img.width;
    const height = img.height;

    console.log('Image size:', width, 'x', height);

    const samples = [];
    const step = 15;
    for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
            const color = img.getPixelColor(x, y);
            const r = (color >> 24) & 0xFF;
            const g = (color >> 16) & 0xFF;
            const b = (color >> 8) & 0xFF;
            samples.push({r, g, b});
        }
    }

    const colorMap = {};
    samples.forEach(c => {
        const key = (Math.floor(c.r/32)*32) + ',' + (Math.floor(c.g/32)*32) + ',' + (Math.floor(c.b/32)*32);
        colorMap[key] = (colorMap[key] || 0) + 1;
    });

    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 20);
    console.log('Dominant colors (quantized to 32 steps):');
    sorted.forEach(([k, v]) => {
        const [r, g, b] = k.split(',').map(Number);
        console.log('RGB(' + r + ', ' + g + ', ' + b + ') - #' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0') + ' - ' + v + ' samples');
    });
}

analyze().catch(err => console.error(err));