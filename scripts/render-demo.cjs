/*
 * Renders the landing-page demo (site/src/demo) into video files.
 *
 *   npm run demo:render                     # en, then ru (one language per process:
 *                                           # a second page load in the same process fails)
 *   npx electron scripts/render-demo.cjs --lang ru --theme dark --frames 3700,8400
 *
 * The scene is a pure function of time, so every frame is rendered exactly (no screen recording).
 * Output: site/public/media/demo-<lang>.{mp4,webm,jpg} and docs/media/demo-<lang>.gif
 */
const { app, BrowserWindow, nativeTheme } = require('electron')
const { mkdirSync, rmSync, writeFileSync, existsSync } = require('node:fs')
const { join } = require('node:path')
const { spawnSync } = require('node:child_process')
const ffmpeg = require('ffmpeg-static')

const ROOT = join(__dirname, '..')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}
const LANGS = [arg('lang', 'en')]
const THEME = arg('theme', 'light')
const FPS = Number(arg('fps', '30'))
const ONLY = arg('frames', null) // comma-separated ms: just save those stills for review
// The scene is laid out at 1600×1000; rendering at 2× keeps the video sharp on retina screens.
const SCALE = Number(arg('scale', '2'))
const WIDTH = 1600 * SCALE
const HEIGHT = 1000 * SCALE

const page = join(ROOT, 'site', 'dist', 'demo.html')
if (!existsSync(page)) {
  console.error('site/dist/demo.html not found — run `npm run site:build` first')
  process.exit(1)
}

function run(args) {
  const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(' ')}`)
}

async function render(lang) {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    useContentSize: true,
    show: false,
    webPreferences: { offscreen: true, backgroundThrottling: false }
  })
  win.webContents.setFrameRate(60)
  win.setContentSize(WIDTH, HEIGHT)
  await win.loadFile(page, { query: { capture: '1', lang } })
  win.webContents.setZoomFactor(SCALE)
  await win.webContents.executeJavaScript(
    'new Promise(r => { const wait = () => (window.__demo ? document.fonts.ready.then(r) : setTimeout(wait, 50)); wait() })'
  )
  const duration = await win.webContents.executeJavaScript('window.__demo.duration')
  const times = ONLY ? ONLY.split(',').map(Number) : Array.from({ length: Math.round((duration / 1000) * FPS) }, (_, i) => (i * 1000) / FPS)

  const frames = join(ROOT, 'out', 'demo-frames', `${lang}-${THEME}`)
  rmSync(frames, { recursive: true, force: true })
  mkdirSync(frames, { recursive: true })
  for (let i = 0; i < times.length; i++) {
    await win.webContents.executeJavaScript(`window.__demo.setTime(${times[i]})`)
    const img = await win.webContents.capturePage({ x: 0, y: 0, width: WIDTH, height: HEIGHT })
    if (i === 0) console.log(`[${lang}] capture size ${JSON.stringify(img.getSize())}`)
    const name = ONLY ? `t${times[i]}.png` : `${String(i).padStart(5, '0')}.png`
    writeFileSync(join(frames, name), img.resize({ width: WIDTH, height: HEIGHT }).toPNG())
    if (i % 60 === 0) process.stdout.write(`\r[${lang}] frame ${i + 1}/${times.length}`)
  }
  process.stdout.write(`\r[${lang}] ${times.length} frames → ${frames}\n`)
  win.destroy()
  if (ONLY) return

  const suffix = THEME === 'light' ? lang : `${lang}-${THEME}`
  const media = join(ROOT, 'site', 'public', 'media')
  const docs = join(ROOT, 'docs', 'media')
  mkdirSync(media, { recursive: true })
  mkdirSync(docs, { recursive: true })
  const input = ['-framerate', String(FPS), '-i', join(frames, '%05d.png')]

  run([...input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', join(media, `demo-${suffix}.mp4`)])
  run([...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-pix_fmt', 'yuv420p', join(media, `demo-${suffix}.webm`)])
  // Poster: the moment the menu is open with the link selected.
  const posterFrame = Math.round((3750 / 1000) * FPS)
  run(['-i', join(frames, `${String(posterFrame).padStart(5, '0')}.png`), '-vf', 'scale=1600:-1', '-q:v', '3', join(media, `demo-${suffix}-poster.jpg`)])
  run([...input, '-vf', 'fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', join(docs, `demo-${suffix}.gif`)])
  console.log(`[${lang}] wrote site/public/media/demo-${suffix}.{mp4,webm,-poster.jpg} and docs/media/demo-${suffix}.gif`)
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = THEME
  try {
    for (const lang of LANGS) await render(lang)
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
  app.quit()
})
