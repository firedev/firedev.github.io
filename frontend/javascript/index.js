import "$styles/index.css"
import "$styles/syntax-highlighting.css"

// Import all JavaScript & CSS files from src/_components
import components from "$components/**/*.{js,jsx,js.rb,css}"

console.info("Bridgetown is loaded!")

// Autoplaying cover videos stop on their poster frame for reduced-motion users (WCAG 2.2.2)
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("video[autoplay]").forEach((video) => {
    video.removeAttribute("autoplay")
    video.pause()
  })
}

// Copy button in the top-right corner of every code block
document.querySelectorAll("pre").forEach((pre) => {
  const wrap = document.createElement("div")
  wrap.className = "copy-wrap"
  pre.before(wrap)
  wrap.append(pre)
  const button = document.createElement("button")
  button.type = "button"
  button.className = "copy-button"
  button.textContent = "Copy"
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText.trim())
      button.textContent = "Copied"
    } catch {
      button.textContent = "Select and copy"
    }
    setTimeout(() => { button.textContent = "Copy" }, 1500)
  })
  const host = pre.closest(".copy-card") || wrap
  host.classList.add("copy-host")
  host.append(button)
})
