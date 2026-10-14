#!/usr/bin/env python3
"""Glut-Cover als SVG erzeugen (Linolschnitt-Plakat: Berg, Weg, Haus mit Schornstein, Sonne).
Aufruf: python3 cover.py > ../cover.svg   – Text nutzt Bricolage Grotesque; PNG danach per Playwright rendern."""
import math, random
R = random.Random(11)
W, H = 800, 1200
GROUND, CREAM, INK = '#F2C8B6', '#FBF3E8', '#3B1220'
COB, COB_D, PERI, SUN, SUN_D = '#2A2BC8', '#1B1C9A', '#6F7BE8', '#F2502E', '#D23A1C'

def cr(points, closed=False, n=14):
    """Catmull-Rom-Spline durch Punkte -> dichte Punktliste."""
    P = points[:]
    if closed: P = [P[-1]] + P + [P[0], P[1]]
    else: P = [P[0]] + P + [P[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i-1], P[i], P[i+1], P[i+2]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2*p1[j]) + (-p0[j]+p2[j])*t + (2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t*t + (-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t**3) for j in (0, 1)))
    out.append(P[-2])
    return out

def d(pts, close=False):
    s = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    return s + ('Z' if close else '')

# ---- Berg ----
mt = cr([(-40,1240),(-40,800),(90,690),(210,600),(330,490),(430,392),(500,452),(590,540),(690,640),(840,770),(840,1240)], n=10)
# ---- Weg (Mittellinie, wird nach unten breiter) ----
center = cr([(432,402),(452,500),(392,590),(300,676),(318,790),(440,880),(520,984),(446,1084),(392,1250)], n=18)
def normals(pts):
    res = []
    for i, (x, y) in enumerate(pts):
        a = pts[max(0, i-1)]; b = pts[min(len(pts)-1, i+1)]
        tx, ty = b[0]-a[0], b[1]-a[1]; l = math.hypot(tx, ty) or 1
        res.append((tx/l, ty/l, -ty/l, tx/l))
    return res
NR = normals(center)
def half_w(i): return 5 + 82 * (i / (len(center)-1)) ** 1.35
def offs(sign, extra=0):
    return [(x + sign*(half_w(i)+extra)*nx, y + sign*(half_w(i)+extra)*ny) for i, ((x, y), (_, _, nx, ny)) in enumerate(zip(center, NR))]
left_edge, right_edge = offs(-1), offs(+1)
path_poly = left_edge + right_edge[::-1]


def tile_patch(x0, y0, cols, rows, sz, rot):
    g = [f'<g transform="rotate({rot} {x0+cols*sz/2:.1f} {y0+rows*sz/2:.1f})">']
    for r in range(rows):
        for c in range(cols):
            x, y = x0 + c*sz, y0 + r*sz; cx, cy = x + sz/2, y + sz/2
            g.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{sz}" height="{sz}" fill="{CREAM if (r+c)%2==0 else "#DCE0FF"}" stroke="{COB}" stroke-width="2.4"/>')
            for dx, dy in ((-.17,0),(.17,0),(0,-.17),(0,.17)):
                g.append(f'<circle cx="{cx+dx*sz:.1f}" cy="{cy+dy*sz:.1f}" r="{.15*sz:.1f}" fill="none" stroke="{COB}" stroke-width="2.2"/>')
            g.append(f'<path d="M{cx:.1f} {cy-.1*sz:.1f} L{cx+.1*sz:.1f} {cy:.1f} L{cx:.1f} {cy+.1*sz:.1f} L{cx-.1*sz:.1f} {cy:.1f}Z" fill="{SUN}"/>')
            for ddx, ddy in ((-.37,-.37),(.37,-.37),(-.37,.37),(.37,.37)):
                g.append(f'<circle cx="{cx+ddx*sz:.1f}" cy="{cy+ddy*sz:.1f}" r="2.6" fill="{COB}"/>')
    g.append('</g>')
    return ''.join(g)

o = []
a = o.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
a('''<defs>
<clipPath id="mt"><path d="%s"/></clipPath>
<clipPath id="lf"><path d="%s"/></clipPath>
<filter id="speck" x="0" y="0" width="100%%" height="100%%">
 <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="n"/>
 <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -6.15" result="s"/>
 <feComposite in="s" in2="SourceGraphic" operator="in"/>
</filter>
<filter id="cut" x="-2%%" y="-2%%" width="104%%" height="104%%">
 <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="w"/>
 <feDisplacementMap in="SourceGraphic" in2="w" scale="2.2"/>
</filter>
</defs>''' % (d(mt, True), d([(-100,-100)] + left_edge + [(-100,1300)], True)))
a(f'<rect width="{W}" height="{H}" fill="{GROUND}"/>')

# ---- Sonne (oben rechts) ----
a('<g filter="url(#cut)">')
a(f'<circle cx="662" cy="132" r="58" fill="{SUN}"/>')
for px in (-17, 17):
    for py in (-25, 0, 25):
        a(f'<circle cx="{662+px}" cy="{132+py}" r="8.5" fill="{CREAM}"/>')
a('</g>')

# ---- Berg: Flächen ----
a('<g filter="url(#cut)">')
a(f'<path d="{d(mt, True)}" fill="{PERI}"/>')
a(f'<g clip-path="url(#mt)"><g clip-path="url(#lf)"><path d="{d(mt, True)}" fill="{COB}"/></g></g>')

def fern(x, y, ang, ln, col, w=2.2):
    s = []
    ex, ey = x + ln*math.cos(ang), y + ln*math.sin(ang)
    s.append(f'<path d="M{x:.1f} {y:.1f} L{ex:.1f} {ey:.1f}" stroke="{col}" stroke-width="{w}" fill="none" stroke-linecap="round"/>')
    n = max(3, int(ln/9))
    for i in range(1, n+1):
        t = i / (n+1); px, py = x + t*(ex-x), y + t*(ey-y); sz = (1 - t*0.55) * ln * 0.34
        for sgn in (-1, 1):
            la = ang + sgn*0.95
            lx, ly = px + sz*math.cos(la), py + sz*math.sin(la)
            s.append(f'<path d="M{px:.1f} {py:.1f} Q{(px+lx)/2 + sgn*sz*0.18*math.sin(la):.1f} {(py+ly)/2 - sgn*sz*0.18*math.cos(la):.1f} {lx:.1f} {ly:.1f}" stroke="{col}" stroke-width="{w:.1f}" fill="none" stroke-linecap="round"/>')
    return ''.join(s)

a('<g clip-path="url(#mt)">')
# Konturlinien entlang des Weges: Bänder mit wechselnder Textur
bands = [(16, 'hatch'), (50, 'dots'), (92, 'hatch'), (150, 'ferns'), (230, 'hatch'), (330, 'dots'), (440, 'hatch')]
step = 11
for side in (-1, 1):
    on_cob = side == -1
    line = '#F7EEE4' if on_cob else COB_D
    for ei in range(16, 520, step):
        pts = offs(side, ei)
        da = f'{R.randint(18,70)} {R.randint(5,16)} {R.randint(4,12)} {R.randint(6,18)}'
        a(f'<path d="{d(pts)}" fill="none" stroke="{line}" stroke-width="{R.choice([1.6,2,2.4])}" stroke-dasharray="{da}" stroke-linecap="round" opacity="{R.choice([.95,.8,.65])}"/>')
    # Punktgruppen
    for _ in range(420):
        i = R.randrange(4, len(center)); (x, y) = center[i]; _t1, _t2, nx, ny = NR[i]
        dist = half_w(i) + R.uniform(22, 330)
        px, py = x + side*dist*nx + R.uniform(-6, 6), y + side*dist*ny + R.uniform(-6, 6)
        a(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{R.choice([1.7,2.1,2.7,3.3]):.1f}" fill="{"#F7EEE4" if on_cob else "#FFF"}" opacity="{R.choice([.9,.7])}"/>')
    # Farne
    for _ in range(0):
        i = R.randrange(8, len(center)-2); (x, y) = center[i]; tx, ty, nx, ny = NR[i]
        dist = half_w(i) + R.uniform(36, 300)
        px, py = x + side*dist*nx, y + side*dist*ny
        ang = math.atan2(ty, tx) + R.uniform(-0.5, 0.5) + (math.pi if R.random() < .5 else 0)
        a(fern(px, py, ang, R.uniform(46, 96), '#FFFFFF' if on_cob else COB_D))
a(tile_patch(566, 676, 3, 3, 52, -5))
a(tile_patch(30, 715, 3, 3, 52, 4))
a('</g>')

# ---- Weg ----
a(f'<path d="{d(path_poly, True)}" fill="{CREAM}"/>')
# Rillen im Weg (Handschnitt)
for k in range(1, 6):
    f = k/6
    pts = [(x + (2*f-1)*half_w(i)*0.8*nx, y + (2*f-1)*half_w(i)*0.8*ny) for i, ((x, y), (_, _, nx, ny)) in enumerate(zip(center, NR)) if i > 40]
    a(f'<path d="{d(pts)}" fill="none" stroke="{GROUND}" stroke-width="1.6" stroke-dasharray="{R.randint(20,50)} {R.randint(14,40)}" stroke-linecap="round" opacity=".6"/>')


PIPS = {1:[(0,0)],2:[(-1,-1),(1,1)],3:[(-1,-1),(0,0),(1,1)],4:[(-1,-1),(1,-1),(-1,1),(1,1)],
        5:[(-1,-1),(1,-1),(0,0),(-1,1),(1,1)],6:[(-1,-1),(1,-1),(-1,0),(1,0),(-1,1),(1,1)],0:[]}
HEAT = {6:'#B81E1A',5:'#E0371F',4:'#F2502E',3:'#F7794F',2:'#F58FA0',1:'#F6A8BE',0:'#D6CEEA'}
a('<g filter="url(#cut)">')
for k, n in enumerate([6, 5, 4, 3, 2, 1, 0]):
    f = 0.13 + k * 0.125
    i = int(f * (len(center) - 1)); (x, y) = center[i]; _t1, _t2, nx, ny = NR[i]
    sz = 36 + 50 * f ** 1.1; off = [0.35, -0.3, 0.28, -0.4, 0.3, -0.25, 0.1][k] * half_w(i)
    px, py = x + off * nx, y + off * ny; rot = [-9, 7, -5, 9, -8, 6, -4][k]
    a(f'<g transform="rotate({rot} {px:.1f} {py:.1f})">')
    a(f'<rect x="{px-sz/2+3:.1f}" y="{py-sz/2+4:.1f}" width="{sz:.1f}" height="{sz:.1f}" rx="{sz*.22:.1f}" fill="#E3B8A4"/>')
    st = f' stroke="{INK}" stroke-width="2" stroke-dasharray="5 4"' if n == 0 else ''
    a(f'<rect x="{px-sz/2:.1f}" y="{py-sz/2:.1f}" width="{sz:.1f}" height="{sz:.1f}" rx="{sz*.22:.1f}" fill="{HEAT[n]}"{st}/>')
    for (qx, qy) in PIPS[n]:
        a(f'<circle cx="{px+qx*sz*.26:.1f}" cy="{py+qy*sz*.26:.1f}" r="{sz*.075:.1f}" fill="{CREAM if n >= 3 else INK}"/>')
    a('</g>')
a('</g>')

# ---- Haus mit Schornstein ----
hx, hy = 432, 404
a(f'<rect x="{hx-34}" y="{hy-30}" width="68" height="40" fill="{CREAM}"/>')
a(f'<path d="M{hx-42} {hy-28} L{hx} {hy-66} L{hx+42} {hy-28}Z" fill="{SUN}"/>')
a(f'<rect x="{hx-6}" y="{hy-14}" width="14" height="24" fill="{INK}"/>')
a(f'<rect x="{hx-26}" y="{hy-20}" width="11" height="11" fill="{COB}"/><rect x="{hx+14}" y="{hy-20}" width="11" height="11" fill="{COB}"/>')
# Brennofen (Kuppel mit glühender Öffnung und hohem Schornstein)
kx, ky = 528, 474
a(f'<rect x="{kx+8}" y="{ky-92}" width="15" height="52" fill="#C9512F"/>')
a(f'<rect x="{kx+5}" y="{ky-96}" width="21" height="7" fill="{INK}"/>')
TERRA = '#C9512F'
a(f'<rect x="{kx-40}" y="{ky-2}" width="80" height="12" fill="{INK}"/>')
a(f'<path d="M{kx-40} {ky} A40 40 0 0 1 {kx+40} {ky}Z" fill="{TERRA}"/>')
for rr in (16, 28, 38):
    a(f'<path d="M{kx-rr} {ky} A{rr} {rr} 0 0 1 {kx+rr} {ky}" fill="none" stroke="{CREAM}" stroke-width="2" stroke-dasharray="10 7" opacity=".85"/>')
a(f'<path d="M{kx-12} {ky} L{kx-12} {ky-16} A12 12 0 0 1 {kx+12} {ky-16} L{kx+12} {ky}Z" fill="{SUN}"/>')
a(f'<path d="M{kx-6} {ky} L{kx-6} {ky-14} A6 6 0 0 1 {kx+6} {ky-14} L{kx+6} {ky}Z" fill="#FFC857"/>')
a('</g>')
# Rauch
sm = cr([(kx+15, ky-102),(kx+27, ky-128),(kx+8, ky-152),(kx+24, ky-178)], n=12)
a(f'<path d="{d(sm)}" fill="none" stroke="{CREAM}" stroke-width="7" stroke-linecap="round" filter="url(#cut)"/>')

# ---- Vordergrund-Blätter ----
def big_leaf(x, y, ang, ln, wd, fill, vein):
    ca, sa = math.cos(ang), math.sin(ang)
    def P(u, v): return (x + u*ca - v*sa, y + u*sa + v*ca)
    top = [P(ln*t, wd*math.sin(math.pi*t)**0.8) for t in [i/16 for i in range(17)]]
    bot = [P(ln*t, -wd*math.sin(math.pi*t)**0.8) for t in [i/16 for i in range(16, -1, -1)]]
    s = f'<path d="{d(top+bot, True)}" fill="{fill}"/>'
    s += f'<path d="{d([P(0,0), P(ln,0)])}" stroke="{vein}" stroke-width="2.6" fill="none"/>'
    for i in range(1, 9):
        t = i/9; w2 = wd*math.sin(math.pi*t)**0.8*0.8
        for sg in (-1, 1):
            q0 = P(ln*t, 0); q1 = P(ln*(t+0.12), sg*w2)
            s += f'<path d="M{q0[0]:.1f} {q0[1]:.1f} L{q1[0]:.1f} {q1[1]:.1f}" stroke="{vein}" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    return s
a('<g filter="url(#cut)">')
for (x, y, ang, ln, wd, fc) in [(-30,1230,-1.05,420,86,COB_D),(10,1240,-0.6,340,66,COB),(60,1250,-1.3,300,60,'#14156F'),
                                (830,1230,-2.2,430,90,COB_D),(790,1250,-2.7,360,72,COB),(760,1250,-1.95,300,60,'#14156F')]:
    a(big_leaf(x, y, ang, ln, wd, fc, '#F7EEE4' if fc != COB else '#CFD3FF'))
a('</g>')

# ---- Wortmarke ----
a(f'<text x="52" y="250" font-family="Bricolage Grotesque" font-size="262" font-weight="600" fill="{INK}" style="font-variation-settings:\'wdth\' 75,\'opsz\' 96;letter-spacing:-4px">Glut.</text>')
a(f'<text x="58" y="306" font-family="Bricolage Grotesque" font-size="30" font-weight="600" fill="{INK}" style="font-variation-settings:\'wdth\' 90,\'opsz\' 14">W&#252;rfel, die abbrennen.</text>')

# ---- Papierkorn (fein, selten) ----
a(f'<rect width="{W}" height="{H}" fill="#FFF8F0" filter="url(#speck)" opacity=".55"/>')
a('</svg>')
print('\n'.join(o))
