import io
import random
import string
from PIL import Image, ImageDraw, ImageFont


def generate_captcha(width=120, height=40, length=4):
    chars = string.ascii_uppercase + string.digits
    code = "".join(random.choices(chars, k=length))
    image = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except OSError:
        font = ImageFont.load_default()
    for i, ch in enumerate(code):
        x = 10 + i * 26
        y = random.randint(2, 8)
        color = (random.randint(0, 120), random.randint(0, 120), random.randint(0, 120))
        draw.text((x, y), ch, font=font, fill=color)
    for _ in range(5):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        draw.line((x1, y1, x2, y2), fill=(200, 200, 200))
    for _ in range(50):
        x, y = random.randint(0, width), random.randint(0, height)
        draw.point((x, y), fill=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    import base64
    img_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return code, img_base64
