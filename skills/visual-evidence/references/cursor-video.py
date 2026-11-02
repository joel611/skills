"""Record a demo clip with a visible cursor and click ring (Playwright, Python).

Copy to the temp folder, fill the CONFIG block and the FLOW section, run with a Python that has
Playwright installed. Never commit the copy. Playwright video does not draw the pointer, so the
overlay is injected into every page with add_init_script.
"""
import re
from playwright.sync_api import sync_playwright

# CONFIG
BASE = "http://127.0.0.1:8000"
OUT = "<tmp>/video"                  # the .webm lands here when the context closes
STATE = "<tmp>/state.json"           # saved login, outside the repo
VIEWPORT = {"width": 1280, "height": 900}

CURSOR_JS = """
(() => {
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 3l14 8-6 2 4 7-3 1-4-7-5 4z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>';
    document.documentElement.appendChild(c);
    const r = document.createElement('div');
    r.style.cssText = 'position:fixed;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(59,130,246,.45);z-index:2147483646;pointer-events:none;opacity:0;transition:opacity .25s, transform .25s';
    document.documentElement.appendChild(r);
    window.addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; }, true);
    window.addEventListener('mousedown', () => { r.style.opacity = 1; r.style.transform = 'scale(1.3)'; }, true);
    window.addEventListener('mouseup', () => { r.style.opacity = 0; r.style.transform = 'scale(1)'; }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mk); else mk();
})();
"""

with sync_playwright() as p:
    b = p.chromium.launch()

    # Log in in a throwaway context with no video, so the clip starts on the page under test.
    login = b.new_context(viewport=VIEWPORT)
    pg = login.new_page()
    pg.goto(BASE + "/<login-path>")
    pg.fill("input[type=email]", "<email>")
    pg.fill("input[type=password]", "<password>")
    pg.get_by_role("button", name="Sign in").click()
    pg.wait_for_url(re.compile(r"<post-login-path>"))
    login.storage_state(path=STATE)
    login.close()

    ctx = b.new_context(viewport=VIEWPORT, storage_state=STATE,
                        record_video_dir=OUT, record_video_size=VIEWPORT)
    ctx.add_init_script(CURSOR_JS)
    pg = ctx.new_page()
    pg.goto(BASE + "/<page-under-test>")
    pg.get_by_role("button", name="<ready-control>").wait_for()
    pg.mouse.move(VIEWPORT["width"] / 2, VIEWPORT["height"] / 2)
    pg.wait_for_timeout(800)

    def go(loc, pause=450):
        """Glide the cursor to the element, pause, click. This is what makes the cursor visibly travel."""
        loc.scroll_into_view_if_needed()
        box = loc.bounding_box()
        pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=30)
        pg.wait_for_timeout(pause)
        pg.mouse.down()
        pg.wait_for_timeout(120)
        pg.mouse.up()
        pg.wait_for_timeout(500)

    # FLOW: one go() per click, keyboard.type(text, delay=90) for typing, wait_for() on UI state
    # between steps, and end on the result for a few seconds.
    go(pg.get_by_role("button", name="<first-control>"))
    pg.get_by_text("<state after the click>").wait_for()
    pg.wait_for_timeout(3000)

    ctx.close()  # flushes the .webm into OUT
    b.close()
