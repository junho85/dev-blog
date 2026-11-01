---
layout: post
title: "라즈베리파이 3.5인치 SPI LCD 설정하기 - 오버레이 한 줄과 함정 다섯 개"
date: 2026-08-17
tags: ["RaspberryPi", "SPI", "LCD", "waveshare", "ILI9486", "framebuffer", "ADS7846", "touch", "maker"]
image: /assets/images/2026-08-17-lcd-poop-dodge-play.jpg
---

집에 놀고 있던 라즈베리파이 3에 서랍에 있던 3.5인치 SPI LCD를 붙였습니다. 결론부터 말하면 **`raspi-config` 에서 SPI 를 켜고, `config.txt` 에 오버레이 한 줄만 넣으면 됩니다.**

다만 그 한 줄을 찾기까지 검색 결과가 하나도 안 통했습니다. **앞쪽에 바로 따라할 수 있는 설정 방법**을, 뒤쪽에 [제가 걸린 함정들](#troubleshooting)을 정리했습니다. 잘 되면 앞쪽만 보시면 됩니다.

![Waveshare 3.5inch RPi LCD (A) V3](/assets/images/2026-08-17-waveshare-35-lcd-board.jpg)

## 이것만 하면 됩니다

**1)** SPI 를 켭니다. **메뉴로 하는 게 제일 쉽습니다.**

```bash
sudo raspi-config
#   3 Interface Options → 목록에서 SPI → <Yes> → <Finish>
```

**2)** 오버레이 한 줄을 추가합니다. 이건 메뉴에 없어서 파일에 직접 넣습니다.

```bash
sudo tee -a /boot/firmware/config.txt <<'EOF'

[all]
dtoverlay=piscreen
EOF

sudo reboot
```

`[all]`을 같이 넣는 이유는 아래 [조건부 필터](#config-filter) 절에 있습니다. 안 넣으면 **파일 구조에 따라 무시될 수 있습니다.**

**3)** 재부팅 후 프레임버퍼 번호가 나오면 성공입니다.

```bash
grep -l fb_ili9486 /sys/class/graphics/fb*/name
# /sys/class/graphics/fb0/name    ← 이 번호를 아래에서 쓴다
```

**4)** 화면에 노이즈를 띄워 확인합니다. 위에서 확인한 번호(`fb0`)로 바꿔 쓰세요. 지지직 패턴이 뜨면 성공입니다([사진](#noise)).

```bash
sudo sh -c "head -c 307200 /dev/urandom > /dev/fb0"
```

> `dtoverlay=waveshare35a`는 이제 없습니다. 벤더의 `LCD-show` 스크립트도 쓰지 마세요. 이유는 [함정 1](#pitfall-1)에 있습니다.
{: .prompt-warning }

## 준비물

- **Raspberry Pi 3 Model B Rev 1.2** (1GB) — 다른 모델도 됩니다
- **Waveshare(SpotPear) 3.5inch RPi LCD (A) V3** — ILI9486 컨트롤러 + ADS7846 호환 저항막 터치, 480×320
- Raspberry Pi OS 13 (trixie), 커널 6.18 — **32비트·64비트 양쪽에서 확인했습니다** ([32비트라야 한다는 얘기](#bitness))

⚠️ 이 LCD는 **HDMI가 아니라 SPI** 방식입니다. HDMI 디스플레이처럼 꽂으면 알아서 되는 물건이 아니라, 커널에 "이 SPI 장치가 화면이다"라고 알려주는 device tree 오버레이가 반드시 필요합니다.

![Raspberry Pi 3 Model B와 Waveshare 3.5인치 LCD](/assets/images/2026-08-17-waveshare-35-lcd-setup.jpg)

### 장착 — 헤더가 26핀이라 방향을 틀리기 쉽습니다

이 LCD의 헤더는 **26핀(2×13)** 이라 Pi의 40핀 헤더 중 **1~26번에만** 꽂힙니다. 짧아서 **어느 쪽으로도 꽂히는데**, 반드시 **1번 핀 쪽(microSD·전원 방향)에 끝을 맞춰야** 합니다. USB 쪽으로 밀어 꽂으면 GPIO 번호가 전부 어긋납니다.

꽂고 부팅하면 **하얀 화면**만 나옵니다. 고장이 아닙니다. 이 제품은 백라이트가 GPIO 제어 없이 상시 ON이라, **백라이트는 켜졌는데 컨트롤러에 데이터가 안 들어간 정상 상태**입니다. 오히려 전원과 백라이트가 살아있다는 신호입니다.

### 전원을 먼저 확인하세요

LCD는 백라이트로 전류를 더 먹습니다. 저전압 상태에서 붙이면 화면이 안 나올 때 **드라이버 문제인지 전원 문제인지 구분이 안 됩니다.**

```bash
vcgencmd get_throttled     # 0x0 이어야 정상
```

`0x0`이 아니면 먼저 해결하세요. 저는 이 단계에서 **케이블 하나 때문에** 클록이 절반으로 묶여 있었습니다. 어댑터 정격이 충분해도 얇은 micro USB 케이블의 전압 강하만으로 저전압이 뜹니다.

## 1. raspi-config 로 SPI 켜기

파일을 편집하기 전에, **메뉴로 할 수 있는 건 메뉴로** 하는 게 편합니다.

```bash
sudo raspi-config
```

```
3 Interface Options  →  목록에서 SPI  →  <Yes>  →  <Finish>
```

> ⚠️ 하위 항목 번호(`I3` / `I4` …)는 **버전마다 밀립니다.** 번호를 외우지 말고 **`SPI` 라는 글자**를 보고 고르세요.
{: .prompt-warning }

CLI 로 하고 싶으면 한 줄로도 됩니다. `0` 이 enable 입니다(셸 종료코드 관례).

```bash
sudo raspi-config nonint do_spi 0
```

**이게 실제로 하는 일**은 `config.txt` 에 `dtparam=spi=on` 한 줄을 넣는 것입니다. 메뉴가 대신 파일을 고쳐주는 것뿐이고, 그래서 직접 그 줄을 써넣어도 결과는 같습니다.

## 2. 오버레이 한 줄 추가

SPI 는 켰습니다. 남은 건 **"이 SPI 장치가 화면이다"** 라고 알려주는 한 줄인데, **이건 raspi-config 메뉴에 없습니다.** 파일에 직접 넣어야 합니다.

```bash
sudo cp /boot/firmware/config.txt /boot/firmware/config.txt.bak    # 백업 권장
sudo tee -a /boot/firmware/config.txt <<'EOF'

[all]
dtoverlay=piscreen
EOF
```

들어갔는지 눈으로 확인하고 재부팅합니다.

```bash
tail -5 /boot/firmware/config.txt
sudo reboot
```

> **편집기를 열지 않는 쪽을 권합니다.** `nano` 로 열어 방향키로 맨 아래까지 내려가 타이핑하다 실수하는 경우가 더 흔합니다. 위 명령은 붙여넣기 한 번으로 끝납니다.
{: .prompt-tip }

> ⚠️ **줄 앞에 `#`을 붙이면 안 됩니다.** `config.txt`에서 `#`은 주석이라, 붙이면 설정이 무시되고 **에러도 없이 아무 일도 일어나지 않습니다.**
{: .prompt-warning }

> 경로가 `/boot/config.txt`가 아니라 **`/boot/firmware/config.txt`** 입니다.
{: .prompt-info }

### `[all]` 은 왜 붙이나 — 조건부 필터 {#config-filter}

`config.txt` 는 **조건부 필터**로 섹션이 갈립니다. `[all]` · `[pi5]` · `[cm4]` 같은 줄이 나오면 **그 이후는 해당 조건에만** 적용되고, `[all]` 은 필터를 해제합니다.

라즈베리파이 OS 기본 `config.txt` 의 끝부분은 대개 이렇게 생겼습니다.

```
[cm4]
otg_mode=1
[cm5]
dtoverlay=dwc2,dr_mode=host
[pi5]
dtoverlay=nospi10
[all]            ← 여기서 필터가 풀린다
```

**마지막이 `[all]` 이면** 파일 끝에 그냥 덧붙여도 모든 모델에 적용됩니다. 하지만 **`[pi5]` 처럼 모델 한정 필터로 끝나는 파일이라면, 덧붙인 줄이 Pi 3 에서 통째로 무시됩니다 — 에러도 없이.** 그래서 `[all]` 을 함께 적어 리셋하는 게 안전합니다.

참고로 `raspi-config` 가 넣는 `dtparam=spi=on` 은 필터가 걸리지 않은 앞부분에 들어가므로 이 문제가 없습니다. 우리가 직접 덧붙이는 오버레이 줄만 신경 쓰면 됩니다.

### 오버레이는 왜 `piscreen` 인가

`piscreen`은 OzzMaker PiScreen용 오버레이지만 **ILI9486 + 저항막 터치** 조합이 같아서 그대로 맞습니다. 핀 배치는 커널 소스에서 확인했습니다.

```
# raspberrypi/linux 의 arch/arm/boot/dts/overlays/piscreen-overlay.dts
reset-gpios = <&gpio 25 GPIO_ACTIVE_LOW>;     # RST  = GPIO25
dc-gpios    = <&gpio 24 GPIO_ACTIVE_HIGH>;    # DC   = GPIO24
led-gpios   = <&gpio 22 GPIO_ACTIVE_HIGH>;    # BL   = GPIO22
interrupts  = <17 2>;                         # 터치 IRQ = GPIO17
compatible  = "ilitek,ili9486";
spi-max-frequency = <24000000>;               # 표시 CS0 24MHz / 터치 CS1 2MHz
```

## 3. 동작 확인 {#noise}

```bash
dmesg | grep -i ili9486
# fb_ili9486 spi0.0: fbtft_property_value: rotate = 270
# graphics fb0: fb_ili9486 frame buffer, 480x320, 300 KiB video memory, fps=33, spi0.0 at 24 MHz

cat /proc/bus/input/devices | grep -A2 ADS7846
# N: Name="ADS7846 Touchscreen"
```

프레임버퍼 번호는 **하드코딩하지 말고 찾으세요.** 부팅마다 `fb0`/`fb1`이 뒤집힙니다([함정 2](#pitfall-2)).

```bash
grep -l fb_ili9486 /sys/class/graphics/fb*/name
# /sys/class/graphics/fb0/name
```

가장 확실한 검증은 노이즈를 써보는 것입니다. 화면에 지지직 패턴이 뜨면 드라이버와 배선 모두 정상입니다.

```bash
# 307200 = 480 x 320 x 2바이트(RGB565)
sudo sh -c "head -c 307200 /dev/urandom > /dev/fb0"
```

![난수를 프레임버퍼에 써서 노이즈가 뜬 LCD 화면](/assets/images/2026-08-17-lcd-noise-test.jpg)
_이게 뜨면 성공. 라이브러리도 그래픽 API도 거치지 않고 **파일에 바이트를 쓴 것뿐**이다_

> 오버레이를 적용하면 `/dev/spidev0.0`, `/dev/spidev0.1`이 **사라집니다.** 정상입니다 — raw SPI 장치를 드라이버가 인수한 것입니다.
{: .prompt-info }

## 4. 화면에 그리기 — `hello-fb.py` {#draw}

fbtft 프레임버퍼는 **16bpp RGB565**입니다. PIL로 그린 RGB 이미지를 그대로 쓰면 안 되고 변환이 필요합니다.

먼저 의존성입니다. PIL과 numpy는 Raspberry Pi OS **desktop 이미지에 기본 포함**되어 있으니 대개 그냥 됩니다. Lite라면 설치하세요.

```bash
sudo apt install -y python3-pil python3-numpy fonts-nanum
```

`hello-fb.py`라는 이름으로 저장합니다.

```python
#!/usr/bin/env python3
# hello-fb.py — SPI LCD 프레임버퍼에 한글 한 줄 띄우기
import glob, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DRIVER = "fb_ili9486"
FONT = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"

# fb 번호는 부팅마다 바뀐다 → 드라이버 이름으로 찾는다
def find_fb(driver=DRIVER):
    for path in sorted(glob.glob("/sys/class/graphics/fb*")):
        if open(f"{path}/name").read().strip() == driver:
            w, h = open(f"{path}/virtual_size").read().strip().split(",")
            return "/dev/" + os.path.basename(path), int(w), int(h)
    raise SystemExit(f"{driver} 프레임버퍼 없음 - dtoverlay 설정을 확인하라")

text = sys.argv[1] if len(sys.argv) > 1 else "안녕 라즈베리파이"
dev, W, H = find_fb()
print(f"framebuffer: {dev}  {W}x{H}")

img = Image.new("RGB", (W, H), (18, 18, 24))
d = ImageDraw.Draw(img)
d.text((24, 30), text, font=ImageFont.truetype(FONT, 30), fill=(255, 205, 70))
d.text((24, H - 40), f"{dev}  {W}x{H}  RGB565",
       font=ImageFont.truetype(FONT, 15), fill=(120, 125, 138))

# RGB → RGB565 (little endian) 변환이 핵심
a = np.asarray(img, dtype=np.uint16)
rgb565 = ((a[:, :, 0] >> 3) << 11) | ((a[:, :, 1] >> 2) << 5) | (a[:, :, 2] >> 3)
with open(dev, "wb") as fb:
    fb.write(rgb565.astype("<u2").tobytes())
```

실행합니다. 프레임버퍼가 `root:video` 소유라 `sudo`가 필요합니다.

```bash
sudo python3 hello-fb.py
# framebuffer: /dev/fb0  480x320

sudo python3 hello-fb.py "아무 문장이나"     # 인자로 다른 문장도 가능
```

![hello-fb.py 실행 결과 - LCD에 한글 출력](/assets/images/2026-08-17-lcd-hello-hangul.jpg)
_다른 라즈베리파이에서 그대로 실행한 결과_

`sudo`를 매번 붙이기 싫으면 사용자를 `video` 그룹에 넣고 재로그인합니다.

```bash
sudo usermod -aG video $USER
```

> 이 파일은 [게임 저장소](https://github.com/junho85/rpi-poop-dodge)에도 `hello-fb.py`로 들어있습니다. 클론해서 바로 실행할 수 있습니다.
{: .prompt-tip }

### 한글 폰트는 나눔을 쓰세요

**DejaVu 폰트에는 한글 글리프가 없습니다.** 위 예제에서 폰트만 DejaVu로 바꾸면 한글이 전부 네모(□)로 나옵니다([아래 게임 절의 비교 사진](#hangul-font) 참고).

**desktop 이미지에도 안 들어있습니다.** 한국 로케일·한국어 키보드로 설치한 64-bit desktop 이미지에서 확인해봤더니 0개였습니다.

```bash
fc-list | grep -c nanum
# 0                    ← 없다

sudo apt install -y fonts-nanum
fc-list :lang=ko | head -1
# /usr/share/fonts/truetype/nanum/NanumGothic.ttf: NanumGothic,나눔고딕
```

> 폰트가 없으면 `hello-fb.py`가 에러 없이 **네모만 잘 그립니다.** 한글이 깨져 보이면 코드를 의심하기 전에 이걸 먼저 확인하세요.
{: .prompt-tip }

숫자가 실시간으로 바뀌는 자리에는 **고정폭 `NanumGothicCoding`** 을 쓰면 글자가 흔들리지 않습니다.

## 5. 터치 읽기 {#touch}

`python3-evdev` 없이 `/dev/input/eventN`을 직접 읽는 방법입니다. 먼저 장치를 찾습니다.

```bash
for d in /sys/class/input/event*; do echo "$(basename $d) -> $(cat $d/device/name)"; done
# event2 -> ADS7846 Touchscreen
```

**핵심은 세 줄로 요약됩니다.** 각각 [함정 3](#pitfall-3)·[4](#pitfall-4)·[5](#pitfall-5)에서 한 번씩 틀려본 결과입니다.

```python
import os, struct, glob

# ① struct 크기는 userland 비트수를 따른다 → native long "l" 을 쓴다
#    (32bit armhf 16바이트 / 64bit 24바이트)
EVENT_FMT = "llHHi"
EVENT_SIZE = struct.calcsize(EVENT_FMT)

EV_KEY, EV_ABS = 0x01, 0x03
ABS_X, ABS_Y, BTN_TOUCH = 0x00, 0x01, 0x14A


class Touch:
    def __init__(self, path):
        self.fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
        self.raw_x = self.raw_y = 0
        self.pressed = False
        self.tap_count = 0

    def poll(self):
        while True:
            try:
                data = os.read(self.fd, EVENT_SIZE * 32)
            except BlockingIOError:
                return
            if not data:
                return
            for off in range(0, len(data) - EVENT_SIZE + 1, EVENT_SIZE):
                _, _, etype, code, value = struct.unpack_from(EVENT_FMT, data, off)
                if etype == EV_ABS:
                    if code == ABS_X:
                        self.raw_x = value
                    elif code == ABS_Y:
                        self.raw_y = value
                    # ② ABS_PRESSURE 는 판정에 쓰지 않는다 (항상 0 일 수 있다)
                elif etype == EV_KEY and code == BTN_TOUCH:
                    was = self.pressed
                    self.pressed = value == 1
                    if self.pressed and not was:
                        # ③ 짧은 탭은 press/release 가 한 배치에 온다 → latch
                        self.tap_count += 1

    def take_tap(self):
        if self.tap_count:
            self.tap_count = 0
            return True
        return False
```

**논블로킹으로 열고 최신 상태만 유지**하는 게 중요합니다. 입력 대기로 루프가 막히면 화면이 멈춥니다.

### 터치 좌표는 회전 때문에 안 맞습니다

`rotate=270`으로 화면이 돌아가 있으니 터치 raw 좌표축(0~4095)과 화면축이 일치하지 않습니다. 두 가지를 맞춰야 합니다.

**① 어느 축이 화면 가로축인가.** 이 패널은 `ABS_X` 였지만 패널·회전 설정에 따라 `ABS_Y` 일 수 있습니다. 그때는 오버레이 파라미터로 커널이 처리하게 하면 됩니다.

```
dtoverlay=piscreen,swapxy        # 축 교환
dtoverlay=piscreen,invx,invy     # 좌표 반전
```

**② raw 값을 화면 픽셀로 어떻게 옮기나.** 이쪽이 진짜 문제입니다.

#### 커널이 알려주는 범위는 믿을 수 없습니다

"`ABS_X`의 min/max로 그냥 스케일하면 되지 않나" 싶은데, 커널에 물어보면 이렇게 옵니다.

```
ABS_X         min=0      max=4095
ABS_Y         min=0      max=4095
ABS_PRESSURE  min=0      max=255
```

**12비트 ADC의 전체 범위, 즉 드라이버 기본값입니다.** 이 패널의 실측값이 아닙니다. `touch-dump.py`로 화면 **물리 가장자리**를 눌러 재보면 이렇습니다.

```
왼쪽 가장자리 : ABS_X  281 ~  431   (중앙값 329)
오른쪽 가장자리: ABS_X 3703 ~ 3742   (중앙값 3732)
```

유효 폭이 `281~3742`, 즉 전체의 **84.5%** 입니다. `0~4095`로 480픽셀에 매핑하면,

| 누른 곳 | 계산된 화면 x | 못 쓰는 폭 |
|---|---|---|
| 왼쪽 끝 | `281/4095 × 480` = **33px** | 33px (6.9%) |
| 오른쪽 끝 | `3742/4095 × 480` = **439px** | 41px (8.6%) |

**합쳐서 약 15%가 죽습니다.** 캐릭터가 화면 끝에 닿지 않는데 에러는 없습니다.

#### 그래서 관측하면서 넓힙니다

실측값을 기본으로 두고, **그보다 넓은 raw가 들어오면 그때그때 넓힙니다.** 보정 절차도, 저장 파일도 필요 없습니다.

```python
RAW_LO, RAW_HI = 281, 3742      # 이 패널 실측값

# ABS_X 를 받을 때마다
if value < self.lo:
    self.lo = value
elif value > self.hi:
    self.hi = value

# 화면 좌표로
span = self.hi - self.lo
screen_x = min(max((self.raw_x - self.lo) / span, 0.0), 1.0) * width
```

다른 패널에서도 몇 번 누르면 맞아지고, 처음 몇 번만 조금 좁게 잡힙니다. 게임에서는 그 차이가 체감되지 않습니다.

> 처음에는 **첫 실행 때 좌/우를 눌러보게 하는 보정 화면**을 만들었습니다. 없앴습니다. 실습에서 매번 두 번 눌러야 하는 게 번거로웠고, 무엇보다 **그 두 점이 화면 양 끝이 아니라서** 정확한 범위도 아니었습니다(타겟 박스가 화면 1/3 폭이라 그 안 어디를 눌렀는지에 따라 값이 달라집니다). 관측값을 누적하는 쪽이 코드도 짧고 결과도 낫습니다.
{: .prompt-info }

## 6. 콘솔 or 그림 — 하나만 고르세요

부팅 메시지와 로그인 콘솔을 LCD로 보내려면 `/boot/firmware/cmdline.txt`(**반드시 한 줄**) 맨 뒤에 추가합니다.

```
fbcon=map:10 fbcon=font:ProFont6x11
```

> **콘솔과 직접 그리기는 양립하지 않습니다.** 콘솔이 프레임버퍼를 차지하면 그리는 프로그램의 출력이 덮입니다. 게다가 **`map:10`은 "fb1"을 가리키는 값**이라, LCD가 fb0으로 잡히는 부팅에서는 엉뚱한 장치를 지목해 콘솔이 아무 데도 안 나옵니다.
{: .prompt-danger }

저는 상태 표시 화면으로 쓰기로 하고 `fbcon` 인자를 뺀 뒤 systemd 서비스로 등록했습니다.

```ini
# /etc/systemd/system/lcd-status.service
[Unit]
Description=LCD status display
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /home/YOUR_USER/lcd-status.py --loop
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now lcd-status
```

## 결과 — 똥피하기 게임

터치가 되니 게임을 만들었습니다. 떨어지는 똥을 터치로 좌우 이동해 피하는 게임입니다 — **맨 위 사진**이 그 화면입니다. 손가락을 댄 x 위치로 캐릭터가 따라오고, 좌상단에 점수·레벨·피한 개수, 우상단에 목숨 3개가 표시됩니다.

### pygame이 아닙니다

**프레임버퍼에 직접 씁니다.** SPI LCD는 KMS/DRM 장치가 아니라 fbdev(`/dev/fbN`)로 노출되고, X도 데스크톱도 안 쓰는 구성이라 pygame이 붙을 표면이 없습니다. 최신 SDL2는 fbdev 백엔드 지원이 사실상 빠져서 오히려 더 번거롭습니다.

| 역할 | 방식 |
|---|---|
| 그리기 | PIL로 그린 뒤 **RGB565로 변환해 `/dev/fbN`에 `write()`** |
| 입력 | **`/dev/input/eventN`을 `struct`로 직접 파싱** (evdev 없이) |
| 루프 | 순수 파이썬 `while` + `time.monotonic()` 기반 dt |

의존성은 PIL과 numpy 둘뿐이고 둘 다 desktop 이미지에 이미 있습니다.

### 한글이 네모로 나왔던 이유 {#hangul-font}

게임 UI를 한글로 만들었더니 처음엔 이렇게 나왔습니다. 영문 `GAME OVER`와 숫자는 멀쩡한데 한글만 전부 네모입니다 — DejaVu 폰트에 한글 글리프가 없기 때문입니다.

![DejaVu 폰트로 한글이 네모로 깨진 게임 오버 화면](/assets/images/2026-08-17-lcd-hangul-broken.jpg)
_폰트 경로만 잘못 잡으면 이렇게 된다_

폰트를 `NanumGothic`으로 바꾸기만 하면 해결됩니다.

![나눔 폰트 적용 후 한글이 정상 출력된 게임 오버 화면](/assets/images/2026-08-17-lcd-hangul-fixed.jpg)
_NanumGothic 적용 후 — 3.5인치에서도 한글이 또렷하게 읽힌다_

### 캐릭터가 찢어져 보이면 — tearing

빠르게 좌우로 움직이면 **캐릭터 머리가 잘린 것처럼** 보일 수 있습니다. fbtft에는 **vsync가 없습니다.** 드라이버가 자체 주기(로그의 `fps=33`)로 dirty 영역을 SPI로 밀어내는데, 그 전송 도중에 앱이 다음 프레임을 덮어쓰면 화면 위/아래가 서로 다른 프레임이 됩니다.

두 가지로 완화했습니다.

**① 변경된 행 구간만 전송** — 307KB를 매번 보내는 대신 캐릭터·똥·HUD가 있는 몇십 줄만 보냅니다. 전송량이 줄면 겹칠 창도 좁아집니다.

```python
rows = np.flatnonzero(np.any(cur != prev, axis=1))
splits = np.flatnonzero(np.diff(rows) > 12) + 1   # 가까운 구간은 합쳐서
for part in np.split(rows, splits):
    y0, y1 = int(part[0]), int(part[-1]) + 1
    fb.seek(y0 * W * 2)
    fb.write(cur[y0:y1].tobytes())
```

**② 드라이버 상한에 맞춰 페이싱** — 33fps보다 빨리 그려도 화면에 반영되지 않고 겹침만 늘어납니다. 처음엔 57fps로 그리고 있었습니다.

그리고 "손가락을 늦게 따라온다"는 별개 문제였습니다. 보간이 `(target - px) * (dt * 11)`이라 한 프레임에 19%만 이동했던 것입니다. 프레임레이트와 무관하게 체감이 일정한 지수 보간으로 바꾸고 최소 속도를 보장했습니다.

```python
step = gap * (1.0 - math.exp(-26.0 * dt))
floor = 900.0 * dt                       # 멀리 떨어졌을 때 답답함 제거
if abs(step) < floor:
    step = math.copysign(min(floor, abs(gap)), gap)
```

### 코드

GitHub에 올렸습니다. 위 세팅이 끝났다면 클론해서 바로 돌려볼 수 있습니다.

> **[github.com/junho85/rpi-poop-dodge](https://github.com/junho85/rpi-poop-dodge)**
{: .prompt-tip }

```bash
git clone https://github.com/junho85/rpi-poop-dodge.git
cd rpi-poop-dodge
sudo python3 poop-dodge.py
```

게임 외에 두 개가 더 들어있습니다.

- **`lcd-status.py`** — 호스트명·IP·온도·클록·스로틀링·부하·메모리·디스크·업타임을 LCD에 띄우는 상태 화면
- **`touch-dump.py`** — 터치가 안 잡힐 때 **추측하지 않고 확인하는** 진단 도구. `TOUCH NOW`를 띄우고 raw 이벤트를 배치 단위로 출력합니다

참고로 앱 쪽 fps는 40~57까지 나오는데, SPI 24MHz로 307KB 프레임을 초당 그만큼 보내는 건 대역폭상 불가능합니다. **앱의 `write()`는 커널 버퍼 복사로 끝나고** 실제 SPI 전송은 fbtft 워커가 자기 주기로 처리하기 때문입니다. 즉 **앱 fps는 화면 갱신률이 아닙니다** — 실제 상한은 드라이버의 `fps=33`입니다.

## pygame 게임도 띄울 수 있습니다 {#pygame}

**pygame 자체는 라즈베리파이에서 잘 됩니다.** 문제는 SPI LCD에 출력하는 것입니다. **SDL2에는 fbdev 백엔드가 없습니다** — SDL 1.2의 `fbcon` 드라이버가 SDL2로 오면서 빠졌고, 남은 건 x11 · wayland · kmsdrm · dummy 정도입니다. 우리 LCD는 `fbtft`가 만든 fbdev 장치라 kmsdrm으로도 못 잡습니다.

그래서 **pygame에게는 그리기만 시키고, 완성된 화면을 우리가 프레임버퍼에 복사**하면 됩니다.

```python
import os
os.environ["SDL_VIDEODRIVER"] = "dummy"   # 창을 만들지 않는다
import numpy as np, pygame

def push(surface, dev, W, H):
    if surface.get_size() != (W, H):
        surface = pygame.transform.smoothscale(surface, (W, H))
    # ⚠️ surfarray 는 (W, H, 3) 축이라 transpose 가 필요하다
    a = np.transpose(pygame.surfarray.array3d(surface), (1, 0, 2)).astype(np.uint16)
    rgb565 = ((a[:, :, 0] >> 3) << 11) | ((a[:, :, 1] >> 2) << 5) | (a[:, :, 2] >> 3)
    with open(dev, "wb") as fb:
        fb.write(rgb565.astype("<u2").tobytes())
```

`pygame.display.flip()`을 후크해두면 **게임 코드를 한 줄도 고치지 않고** 이 복사가 자동으로 일어납니다.

```python
orig_flip = pygame.display.flip
def flip():
    orig_flip()
    push(pygame.display.get_surface(), dev, W, H)
pygame.display.flip = flip
```

### 실제로 해봤습니다 — 아이가 만든 게임

아이가 윈도우에서 pygame으로 만든 러너 게임을 라즈베리파이 LCD에 올렸습니다. 조작은 아이가 아두이노로 만든 버튼 조종기입니다.

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:8px;margin:1.2rem 0;">
  <iframe src="https://www.youtube.com/embed/zsrg_dtOCDw"
    title="첫째가 만든 게임을 라즈베리파이에 올리고 아두이노로 만든 조종기로 조작하기"
    loading="lazy" allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
</div>

옮기면서 걸린 게 화면 말고도 두 개 더 있었습니다.

**① 윈도우 포트명** — 코드에 `serial.Serial('COM4', 9600)`이 박혀 있었습니다. 리눅스에서는 `/dev/ttyACM0`(아두이노 UNO는 CDC ACM)입니다. `serial.Serial`을 감싸서 **`COM*`이면 `/dev/ttyACM*`를 자동으로 찾게** 했습니다.

**② 없는 리소스** — PNG 파일이 아직 안 넘어온 상태였는데, `pygame.image.load`에서 바로 죽습니다. 이것도 감싸서 **없으면 자리표시 Surface**를 돌려주게 했습니다. 그림 없이도 일단 플레이가 되니 나머지를 먼저 검증할 수 있었습니다.

그리고 **LCD 터치를 아두이노 버튼과 같은 입력으로** 주입했습니다. 게임이 `ser.in_waiting` / `ser.read()`만 쓰므로, 그 둘을 흉내내는 객체에서 터치 탭을 `'J'` 문자로 흘려보내면 됩니다. 조종기 없이도 화면만 만져서 플레이됩니다.

### 조종기는 문자 하나만 보냅니다

아이가 만든 조종기 쪽도 놀랄 만큼 단순합니다. **아두이노가 하는 일은 버튼을 읽어 문자 하나를 보내는 것**뿐입니다.

```
[버튼] → 아두이노 UNO → USB 시리얼 9600bps → 게임의 ser.read()
                          'J' 한 글자
```

배선도 두 개뿐입니다. 버튼 한쪽 다리를 **D2**, 다른쪽을 **GND** 에 꽂습니다. `INPUT_PULLUP` 을 쓰면 **풀업 저항이 필요 없습니다** — 누르지 않으면 `HIGH`, 누르면 `GND` 로 떨어져 `LOW` 입니다.

스케치에서 중요한 건 두 줄입니다.

```cpp
// 접점은 누르는 순간 수 ms 동안 값이 튄다(bouncing).
// 그대로 읽으면 한 번 눌러도 여러 번 눌린 것으로 잡힌다.
if (millis() - lastChangeMs >= DEBOUNCE_MS && reading != stableState) {
  stableState = reading;
  if (stableState == LOW) Serial.write('J');   // 누르는 순간에만
}
```

**① 디바운스** 없이 읽으면 한 번 눌러도 여러 번 점프합니다. **② 누르는 순간(엣지)에만** 보내야 합니다 — 누르고 있는 동안 계속 보내면 게임에서 연타가 됩니다.

Pi 쪽에서 확인은 이렇게 합니다.

```bash
ls /dev/ttyACM*        # UNO 는 CDC ACM 으로 잡힌다
python3 -c "import serial; s=serial.Serial('/dev/ttyACM0',9600,timeout=5); print(s.read(4))"
```

버튼을 네 번 누르면 `b'JJJJ'` 가 나옵니다. 안 나오면 **Arduino IDE 의 시리얼 모니터를 닫았는지** 보세요 — 포트를 잡고 있으면 다른 프로그램이 못 읽습니다.

#### 버튼 두 개로 늘리면 — 뗄 때도 보내야 합니다

똥피하기는 좌우로 움직이는 게임이라 버튼이 두 개 필요합니다. 그런데 **누르는 순간만 보내면 게임이 언제 멈춰야 할지 모릅니다.** 그래서 뗄 때도 보냅니다.

| 버튼 | 누를 때 | 뗄 때 |
|---|---|---|
| 왼쪽 (D2) | `L` | `l` |
| 오른쪽 (D3) | `R` | `r` |

버튼을 배열로 두면 늘리기도 쉽습니다.

```cpp
struct Button {
  const uint8_t pin;
  const char press;             // 누를 때 보낼 문자
  const char release;           // 뗄 때 보낼 문자 (0 = 보내지 않음)
  int lastReading, stableState;
  unsigned long lastChangeMs;
};

Button buttons[] = {
  {2, 'L', 'l', HIGH, HIGH, 0},
  {3, 'R', 'r', HIGH, HIGH, 0},
};
```

실제로 재보니 한 번 누름에 문자 하나씩 정확히 왔습니다.

```
받음: 'L' → 'l' → 'R' → 'r' ...
총 'LlRrLlRrLlRrLlRrLlRrLl'
```

만들면서 걸린 것 세 가지를 적어둡니다.

**① `.ino` 파일명은 폴더명과 같아야 합니다.** 다르면 Arduino IDE가 "폴더를 만들어 옮기겠냐"고 묻고, `arduino-cli`는 이렇게 거절합니다.

```
Can't open sketch: main file missing from sketch: .../arduino-controller.ino
```

**② 부팅 배너를 넣으면 진단이 빨라집니다.** 꽂자마자 문자가 오면 업로드·통신·보드레이트가 한 번에 확인되고, 남는 변수는 배선 하나뿐입니다. 단 **배너에 프로토콜 문자(`L l R r`)를 쓰면 안 됩니다** — 게임이 입력으로 오해합니다.

```cpp
Serial.write("# btn2 ok\n");
```

**③ 아두이노를 Pi에 꽂는 순간 Pi가 재부팅했습니다.** 꽂을 때의 순간 전류 때문입니다. 붙은 뒤에는 `throttled=0x0` 으로 안정적이었으니, **아두이노를 먼저 꽂고 Pi 전원을 넣으면** 됩니다.

> 스케치와 배선·트러블슈팅은 저장소의 [`arduino-controller/`](https://github.com/junho85/rpi-poop-dodge/tree/main/arduino-controller) 에 있습니다.
{: .prompt-tip }

재미있는 건 게임 입장에서 **조종기든 LCD 터치든 같은 입력**이라는 점입니다. 런처가 터치 탭을 같은 문자로 주입하니, 조종기가 없어도 화면을 만져서 플레이됩니다.

이 런처는 저장소에 `pygame-on-lcd.py`로 넣어뒀습니다.

```bash
sudo python3 pygame-on-lcd.py your-game.py
```

> 게임 해상도가 LCD와 다르면 자동으로 스케일합니다. 이번 게임은 아이가 **480×320으로 만들어서** 스케일 없이 1:1로 나왔습니다.
{: .prompt-tip }

### 더 정석적인 길 — `piscreen,drm`

`piscreen` 오버레이에는 **`drm` 파라미터**가 있습니다. FBTFT 대신 DRM/KMS 드라이버를 쓰는 옵션입니다.

```
dtoverlay=piscreen,drm
```

이러면 LCD가 `/dev/dri/cardN`으로 잡히고, **`SDL_VIDEODRIVER=kmsdrm`으로 pygame이 우회 없이 직접** 붙을 수 있습니다. ⚠️ 다만 제가 검증하지 않았습니다 — HDMI와 카드가 둘이 되니 어느 쪽을 쓸지 지정해야 하고, fbdev 경로(`/dev/fbN`)가 사라져서 이 글의 다른 스크립트들은 못 쓰게 될 수 있습니다.

---

# 트러블슈팅 {#troubleshooting}

여기부터는 삽질 기록입니다. 위 설정으로 잘 됐다면 읽지 않아도 됩니다. 다섯 개 중 **둘은 "인터넷 안내가 지금은 유효하지 않은"** 종류이고, **셋은 제 코드 문제**였습니다.

## 함정 1. `waveshare35a` 오버레이가 이제 없습니다 {#pitfall-1}

검색하면 거의 모든 글이 이걸 시킵니다.

```
dtoverlay=waveshare35a
```

그런데 **최신 Raspberry Pi OS에는 이 오버레이 파일이 없습니다.** 직접 확인해보면 압니다.

```bash
ls /boot/firmware/overlays/ | grep -i waveshare
# vc4-kms-dsi-waveshare-800x480.dtbo
# vc4-kms-dsi-waveshare-panel.dtbo
# waveshare-can-fd-hat-mode-a.dtbo
# ... waveshare35a.dtbo 는 없다
```

범용 `fbtft` 오버레이의 지원 목록에도 `waveshare32b`, `waveshare22`는 있지만 **35a는 빠져 있습니다.**

```bash
awk '/^Name:[[:space:]]*fbtft$/,/^Name:[[:space:]]*fe-pi/' /boot/firmware/overlays/README | grep waveshare
#         waveshare32b            Waveshare 3.2
#         waveshare22             Waveshare 2.2
```

그리고 벤더가 안내하는 `LCD-show` 스크립트는 **`config.txt`를 통째로 덮어쓰고** 옛 커널·X11 시절 가정을 밀어넣습니다. 게다가 그 스크립트가 기대하는 오버레이 자체가 없으니, 되돌리기 어려운 상태만 만들 위험이 큽니다. **실행하지 않는 쪽을 권합니다.**

`piscreen`이 안 맞는 하드웨어라면 범용 `fbtft`로 핀을 직접 지정하는 방법이 있습니다.

```
dtoverlay=fbtft,spi0-0,ili9486,bgr,reset_pin=25,dc_pin=24,rotate=270,speed=16000000
```

## 함정 2. `/dev/fb1`이라는 가정이 깨집니다 {#pitfall-2}

인터넷 안내는 대체로 "LCD는 `/dev/fb1`이니 여기에 쓰면 된다"고 합니다. 저도 그렇게 짰고 잘 돌았습니다. **그런데 재부팅하니 아무것도 안 나왔습니다.**

```
1차 부팅: [ 9.891] vc4-drm ... fb0: vc4drmfb     →  LCD는 fb1
2차 부팅:  (vc4 프레임버퍼 등록 안 됨)          →  LCD가 fb0
```

프레임버퍼 번호는 **등록 순서로 정해지고**, vc4 KMS와 SPI 드라이버의 프로브 타이밍 경합에 따라 갈립니다. 증상이 고약한 이유는 **하드코딩한 스크립트가 에러 없이 조용히 실패**한다는 점입니다. 장치는 멀쩡한데 화면만 죽은 것처럼 보입니다.

해법은 위 [화면에 그리기 단계의 `find_fb()`](#draw)입니다. 번호가 아니라 `/sys/class/graphics/fb*/name`의 드라이버 이름으로 찾고, 해상도도 `virtual_size`에서 읽으면 회전 설정을 바꿔도 안전합니다.

### 왜 에러가 안 나는가 — `/dev` 에 파일이 생깁니다

번호를 틀리면 셸이 **없는 장치 이름으로 새 파일을 만듭니다.** `/dev`는 쓰기 가능한 devtmpfs이고 root로 실행하니 막힐 이유가 없습니다.

```bash
sudo sh -c "head -c 307200 /dev/urandom > /dev/fb1"   # LCD가 fb0 인데 fb1 이라고 썼다
# (에러 없음. 종료 코드 0)

ls -la /dev/fb1
# -rw-r--r-- 1 root root 307200 ...    ← 장치가 아니라 그냥 파일이다
```

**명령은 성공하고 화면만 안 바뀝니다.** 저는 이 글을 쓰는 중에도 `cut` 필드를 잘못 세어 `/dev/name`이라는 파일을 만들었고, "노이즈 OK"라는 제 출력만 보고 성공했다고 판단했습니다.

```bash
ls -la /dev/fb*        # 장치는 맨 앞이 c (character device), 파일은 -
# crw-rw---- 1 root video 29, 0 ... /dev/fb0     ← 진짜 장치
```

`c`로 시작하는지만 보면 됩니다.

## 함정 3. 압력값으로 눌림을 판정하지 마세요 {#pitfall-3}

압력으로 "눌림"을 판정했는데 전혀 반응하지 않았습니다. 이벤트는 한 접촉마다 이 순서로 옵니다.

```
BTN_TOUCH=1  →  ABS_X  →  ABS_Y  →  ABS_PRESSURE  →  SYN_REPORT
```

`BTN_TOUCH=1`로 잡은 눌림 상태를 뒤따르는 `ABS_PRESSURE`가 덮어쓰는 구조였습니다. 눌림 판정은 **`BTN_TOUCH` 하나만 믿는 게** 단순하고 안전합니다 — 임계값을 고를 필요도 없고, 압력 보고 여부가 드라이버·패널에 따라 갈리는 것도 신경 쓸 필요가 없습니다.

> 🔴 **원인 귀속을 정정합니다.** 처음 이 글에는 *"`xohms`(x-plate-ohms) 파라미터를 주지 않으면 ADS7846이 압력을 계속 0으로 보고한다"* 고 썼습니다. 나중에 **같은 패널·같은 `dtoverlay=piscreen`(`xohms` 없음)** 으로 재측정했더니 이렇게 나왔습니다.
>
> ```
> ABS_PRESSURE min=14  max=90  0인 샘플 = 0개 (38개 전부)
> ```
>
> **그 진단은 재현되지 않습니다.** 압력이 0으로 보였던 시점에는 [함정 5](#pitfall-5)의 `struct` 파싱 버그가 아직 남아 있었습니다. 포맷이 어긋나면 `code`와 `value`가 타임스탬프 조각이 되니 압력이 0으로 보일 수 있습니다. 다만 그 환경이 남아 있지 않아 **확정하지는 못했습니다.**
>
> 교훈은 이쪽이 더 큽니다 — **원인을 특정하기 전에 가설을 원인으로 적어두면, 나중에 진짜 원인을 찾아도 앞의 기록이 남습니다.**
{: .prompt-danger }

## 함정 4. 짧은 탭은 한 번의 `read()`에 통째로 들어옵니다 {#pitfall-4}

`BTN_TOUCH`로 바꿨는데도 안 잡혔습니다. 저항막 터치를 톡 누르면 접촉이 수십 ms뿐이고, 그동안 **`BTN_TOUCH=1`부터 `=0`까지가 한 배치에 함께** 도착합니다. 배치를 다 처리하면 상태는 항상 "뗀 상태"라, `pressed`만 검사하는 코드는 **아무리 눌러도 영원히 못 봅니다.**

그래서 눌림 시작을 `tap_count`로 latch해서 소비합니다([터치 읽기 단계 코드](#touch)의 `take_tap()`).

**latch는 반드시 소비해야 합니다.** 안 비우면 `contact()`가 영구히 True로 남습니다. 저는 이걸 안 하다가 실제로 물렸습니다 — 아두이노 조종기를 붙인 뒤 **버튼과 터치를 번갈아 쓰면 캐릭터가 마지막 터치 위치로 튀었습니다.** 버튼을 뗀 순간 남아 있던 latch가 살아난 것입니다.

```python
if dx:                          # 조종기로 조작 중
    self.px += dx * SPEED * dt
    self.touch.take_tap()       # 남은 터치 latch 를 버린다
elif self.touch.contact():
    ...
    if not self.touch.pressed and abs(gap) < 2.0:
        self.touch.take_tap()   # 탭이 목표에 도달했으면 소비
```

여러 단계로 넘어가는 화면에서도 같습니다. 다음 단계 전에 비우지 않으면 **한 번 누른 게 두 단계를 동시에 통과**합니다.

## 함정 5. `struct` 크기를 8바이트로 박으면 깨집니다 {#pitfall-5}

앞의 두 수정에도 안 되자 이벤트를 그대로 덤프해봤습니다.

```
batch#001 (3) 61466/27266=648498 ABS_Y=2200 61466/27266=648498
```

**타입·코드가 쓰레기 값입니다.** 구조체 크기가 어긋난 것입니다.

```c
struct input_event {
    struct timeval time;   // long 2개
    __u16 type; __u16 code; __s32 value;
};
```

`struct timeval`은 **long 2개**라서 크기가 userland 비트수를 따릅니다. 32비트는 16바이트, 64비트는 24바이트입니다. 저는 `"qqHHi"`(q = 고정 8바이트, 합 24바이트)로 박아뒀는데, 이 Pi는 32비트였습니다.

```bash
dpkg --print-architecture     # armhf
python3 -c "import platform; print(platform.machine())"   # armv7l
getconf LONG_BIT              # 32
```

**해법은 native long입니다.** `"llHHi"`로 쓰면 32/64비트 양쪽에서 자동으로 맞습니다.

### 아키텍처를 커널로 판단하면 틀립니다

더 근본적인 오진이 있었습니다. 이미지 커널이 `6.18.34+rpt-rpi-v8`이고 **`v8`은 arm64**니까 64비트라고 단정했던 것입니다. 그런데 **Raspberry Pi OS 32-bit는 Pi 3 이상에서 64비트 커널을 로드**합니다. 커널 비트수와 userland 비트수는 별개입니다.

힌트가 하나 더 있었는데 놓쳤습니다. `/etc/os-release`의 이름이 갈립니다.

| userland | PRETTY_NAME |
|---|---|
| 32비트 | **Raspbian** GNU/Linux |
| 64비트 | **Debian** GNU/Linux |

아키텍처는 `uname -m`이 아니라 **userland 기준**(`dpkg --print-architecture`)으로 봐야 합니다.

### 그럼 32비트를 골라야 하나 — 아닙니다 {#bitness}

**"SPI LCD를 쓰려면 32비트를 골라라"** 는 얘기가 돌아다닙니다. 저도 그렇게 알고 있었는데 근거를 설명할 수 없어서, **64-bit 이미지로 다시 구워 확인했습니다.**

```
dpkg           : arm64
uname -m       : aarch64
os-release     : PRETTY_NAME="Debian GNU/Linux 13 (trixie)"

fb0 : fb_ili9486  480,320
[   11.895516] graphics fb0: fb_ili9486 frame buffer, 480x320, fps=31, spi0.0 at 24 MHz
N: Name="ADS7846 Touchscreen"
```

**전부 그대로 됩니다.** 오버레이 바인딩, 프레임버퍼 그리기, 한글, 터치, 게임까지 확인했습니다.

그 말의 출처는 **[`fbcp-ili9341`](https://github.com/juj/fbcp-ili9341)** 입니다. HDMI 화면을 SPI LCD로 복사해주는 도구인데, 라즈베리파이의 옛 **DispmanX** API에 의존해서 64비트에서는 빌드되지 않습니다. 이 글의 방식은 **커널 드라이버(`fbtft`)에 직접 그리는 것**이라 그 제약과 무관합니다.

다만 64비트로 옮기면 **위에서 본 `struct input_event`가 16 → 24바이트로 바뀝니다.** `"llHHi"`로 써두면 코드를 고칠 일이 없습니다.

## 하드웨어부터 배제하세요

터치 쪽 세 함정은 전부 **"하드웨어는 정상인데 내 판정이 틀린"** 경우였습니다. IRQ 카운트를 먼저 확인해 하드웨어를 배제한 게 그나마 시간을 아꼈습니다.

```bash
grep ads7846 /proc/interrupts    # 터치할 때 카운트가 오르면 하드웨어 정상
```

## 정리

| 함정 | 증상 | 해결 |
|---|---|---|
| 흰 화면 | 아무것도 안 나옴 | 고장 아님. 백라이트 상시 ON + 드라이버 미설정 |
| `waveshare35a` 없음 | 오버레이 적용 실패 | **`dtoverlay=piscreen`** |
| `LCD-show` 스크립트 | config.txt 덮어씀 | 실행하지 않기 |
| fb 번호 하드코딩 | 재부팅 후 조용히 실패 | `/sys/class/graphics/fb*/name`으로 탐색 |
| 압력값으로 눌림 판정 | 터치 무반응 | `BTN_TOUCH`만 신뢰 (압력이 0이라는 진단은 [정정](#pitfall-3)) |
| 짧은 탭 유실 | 톡 눌러도 무반응 | 눌림 시작을 latch |
| `struct` 24바이트 가정 | 이벤트 파싱 깨짐 | **`"llHHi"`**(native long) |
| 커널로 아키텍처 판단 | 32/64비트 오판 | `dpkg --print-architecture` |
| 저전압 경고 | 클록이 절반으로 묶임 | 어댑터보다 **케이블**을 먼저 의심 |

가장 값진 교훈은 **"검색 결과와 내 환경의 차이를 먼저 확인하라"** 였습니다. `waveshare35a`도 `/dev/fb1`도 예전엔 맞는 안내였고, 지금 이 이미지에서만 틀립니다. `ls /boot/firmware/overlays/`와 `dmesg` 한 번이면 확인되는 것이었는데, 검색 결과를 그대로 믿고 시작해서 시간을 썼습니다.

그리고 추측으로 두 번 고치고 두 번 다 빗나간 뒤에야 이벤트를 그대로 덤프했습니다. **애초에 그것부터 했어야 했습니다.** 그래서 진단 도구(`touch-dump.py`)를 저장소에 같이 넣어뒀습니다.
