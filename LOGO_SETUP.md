# Logo and Favicon Setup Instructions

## 1. Save the Logo

You need to save the Lazy Habbit sloth logo image to the project:

1. **Save the circular logo image** (the one with the sloth and "lazy habbit" text) as:
   - `public/images/logo-full.png` (full size - at least 512x512px)

## 2. Generate Favicons

Once you've saved the logo, you can generate favicons using online tools or the commands below:

### Option A: Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `public/images/logo-full.png`
3. Configure your preferences
4. Download the generated favicon package
5. Extract files to `public/` directory

### Option B: Using Node Package (if you have ImageMagick installed)
```bash
npm install -g sharp-cli
cd public/images
sharp -i logo-full.png -o ../favicon.ico resize 32 32 -- --format ico
```

### Option C: Manual Conversion
If you have image editing software (GIMP, Photoshop, etc.):
1. Open `logo-full.png`
2. Resize to 32x32px (for favicon.ico)
3. Save as `public/favicon.ico`
4. Create additional sizes: 16x16, 32x32, 192x192, 512x512

## 3. Verify Installation

After copying the logo and generating favicons:

1. Check that `public/images/logo-full.png` exists
2. Check that `public/favicon.ico` exists
3. Run `npm run build` to verify no errors
4. The footer should now display the logo
5. Browser tab should show your custom favicon

## 4. Update PWA Icons (Optional)

For a complete PWA experience, also generate these sizes in `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

You can use the same RealFaviconGenerator tool for this.
