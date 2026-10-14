#!/usr/bin/env python3
"""Glut-Cover (v0.4): Brennofen im Mittelpunkt. Kuppelofen aus Terrakotta mit glühender Öffnung und 6er-Würfel im Feuer,
Weg mit abkühlenden Würfeln, Kachel-Intarsien in den Hügeln, Sonne als Würfel.
Aufruf: python3 cover.py > cover.svg  (Text nutzt Bricolage Grotesque; PNG danach per render-cover.mjs)."""
import math, random
R = random.Random(11)
W, H = 800, 1200
GROUND, CREAM, INK = '#F2C8B6', '#FBF3E8', '#3B1220'
COB, COB_D, PERI, SUN, SUN_D, TERRA = '#2A2BC8', '#1B1C9A', '#6F7BE8', '#F2502E', '#D23A1C', '#C9512F'
HEAT = {6: '#B81E1A', 5: '#E0371F', 4: '#F2502E', 3: '#F7794F', 2: '#F58FA0', 1: '#F6A8BE', 0: '#D6CEEA'}
PIPS = {1: [(0,0)], 2: [(-1,-1),(1,1)], 3: [(-1,-1),(0,0),(1,1)], 4: [(-1,-1),(1,-1),(-1,1),(1,1)],
        5: [(-1,-1),(1,-1),(0,0),(-1,1),(1,1)], 6: [(-1,-1),(1,-1),(-1,0),(1,0),(-1,1),(1,1)], 0: []}
KX, KB, KR = 400, 806, 262      # Ofen: Mitte x, Grundlinie, Kuppelradius

def cr(points, n=14):
    P = [points[0]] + points[:] + [points[-1]]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i-1], P[i], P[i+1], P[i+2]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2*p1[j]) + (-p0[j]+p2[j])*t + (2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t*t + (-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t**3) for j in (0, 1)))
    out.append(P[-2]); return out
def d(pts, close=False):
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ('Z' if close else '')

mt = cr([(-40,1240),(-40,640),(110,586),(250,612),(400,632),(560,610),(700,566),(840,610),(840,1240)], n=10)
center = cr([(400,520),(400,700),(404,806),(420,880),(352,962),(334,1044),(402,1124),(436,1260)], n=16)
def normals(pts):
    res = []
    for i, (x, y) in enumerate(pts):
        a = pts[max(0, i-1)]; b = pts[min(len(pts)-1, i+1)]
        tx, ty = b[0]-a[0], b[1]-a[1]; l = math.hypot(tx, ty) or 1
        res.append((tx/l, ty/l, -ty/l, tx/l))
    return res
NR = normals(center)
i0 = next(i for i, (x, y) in enumerate(center) if y >= KB - 10)
def half_w(i): return 46 + 96 * max(0, (center[i][1] - KB)) / (1260 - KB)
def offs(sign, extra=0, start=0):
    return [(x + sign*(half_w(i)+extra)*nx, y + sign*(half_w(i)+extra)*ny) for i, ((x, y), (_, _, nx, ny)) in enumerate(zip(center, NR)) if i >= start]
left_edge, right_edge = offs(-1, 0, i0), offs(+1, 0, i0)
path_poly = left_edge + right_edge[::-1]
lf_poly = [(-100,-100)] + offs(-1, 0, 0) + [(-100,1300)]

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
    g.append('</g>'); return ''.join(g)

def die(px, py, sz, n, rot=0, shadow=True):
    s = f'<g transform="rotate({rot} {px:.1f} {py:.1f})">'
    if shadow: s += f'<rect x="{px-sz/2+3:.1f}" y="{py-sz/2+4:.1f}" width="{sz:.1f}" height="{sz:.1f}" rx="{sz*.22:.1f}" fill="#E3B8A4"/>'
    st = f' stroke="{INK}" stroke-width="2" stroke-dasharray="5 4"' if n == 0 else ''
    s += f'<rect x="{px-sz/2:.1f}" y="{py-sz/2:.1f}" width="{sz:.1f}" height="{sz:.1f}" rx="{sz*.22:.1f}" fill="{HEAT[n]}"{st}/>'
    for qx, qy in PIPS[n]:
        s += f'<circle cx="{px+qx*sz*.26:.1f}" cy="{py+qy*sz*.26:.1f}" r="{sz*.075:.1f}" fill="{CREAM if n >= 3 else INK}"/>'
    return s + '</g>'

def big_leaf(x, y, ang, ln, wd, fill, vein):
    ca, sa = math.cos(ang), math.sin(ang)
    def P(u, v): return (x + u*ca - v*sa, y + u*sa + v*ca)
    top = [P(ln*t, wd*math.sin(math.pi*t)**0.8) for t in [i/16 for i in range(17)]]
    bot = [P(ln*t, -wd*math.sin(math.pi*t)**0.8) for t in [i/16 for i in range(16, -1, -1)]]
    s = f'<path d="{d(top+bot, True)}" fill="{fill}"/><path d="{d([P(0,0), P(ln,0)])}" stroke="{vein}" stroke-width="2.6" fill="none"/>'
    for i in range(1, 9):
        t = i/9; w2 = wd*math.sin(math.pi*t)**0.8*0.8
        for sg in (-1, 1):
            q0 = P(ln*t, 0); q1 = P(ln*(t+0.12), sg*w2)
            s += f'<path d="M{q0[0]:.1f} {q0[1]:.1f} L{q1[0]:.1f} {q1[1]:.1f}" stroke="{vein}" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    return s

o = []; a = o.append
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
</defs>''' % (d(mt, True), d(lf_poly, True)))
a(f'<rect width="{W}" height="{H}" fill="{GROUND}"/>')

# Sonne = Würfel mit 6 Augen
a('<g filter="url(#cut)">')
a(f'<circle cx="662" cy="132" r="58" fill="{SUN}"/>')
for px in (-17, 17):
    for py in (-25, 0, 25): a(f'<circle cx="{662+px}" cy="{132+py}" r="8.5" fill="{CREAM}"/>')
a('</g>')

# Hügel mit Konturtextur
a('<g filter="url(#cut)">')
a(f'<path d="{d(mt, True)}" fill="{PERI}"/>')
a(f'<g clip-path="url(#mt)"><g clip-path="url(#lf)"><path d="{d(mt, True)}" fill="{COB}"/></g></g>')
a('<g clip-path="url(#mt)">')
for side in (-1, 1):
    on_cob = side == -1; line = '#F7EEE4' if on_cob else COB_D
    for ei in range(30, 560, 11):
        pts = offs(side, ei, 0)
        da = f'{R.randint(18,70)} {R.randint(5,16)} {R.randint(4,12)} {R.randint(6,18)}'
        a(f'<path d="{d(pts)}" fill="none" stroke="{line}" stroke-width="{R.choice([1.6,2,2.4])}" stroke-dasharray="{da}" stroke-linecap="round" opacity="{R.choice([.95,.8,.65])}"/>')
    for _ in range(360):
        i = R.randrange(20, len(center)); (x, y) = center[i]; _t1, _t2, nx, ny = NR[i]
        dist = half_w(i) + R.uniform(40, 340)
        px, py = x + side*dist*nx + R.uniform(-6, 6), y + side*dist*ny + R.uniform(-6, 6)
        a(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{R.choice([1.7,2.1,2.7,3.3]):.1f}" fill="{"#F7EEE4" if on_cob else "#FFF"}" opacity="{R.choice([.9,.7])}"/>')
a('</g>')
# Weg aus der Ofenöffnung
a(f'<path d="{d(path_poly, True)}" fill="{CREAM}"/>')
for k in range(1, 6):
    f = k/6
    pts = [(x + (2*f-1)*half_w(i)*0.8*nx, y + (2*f-1)*half_w(i)*0.8*ny) for i, ((x, y), (_, _, nx, ny)) in enumerate(zip(center, NR)) if i > i0 + 6]
    a(f'<path d="{d(pts)}" fill="none" stroke="{GROUND}" stroke-width="1.6" stroke-dasharray="{R.randint(20,50)} {R.randint(14,40)}" stroke-linecap="round" opacity=".6"/>')
a('</g>')

# Würfel kühlen auf dem Weg ab (heiß am Ofen, kalt unten)
a('<g filter="url(#cut)">')
span = len(center) - 1 - i0
for k, n in enumerate([5, 4, 3, 2, 1, 0]):
    f = 0.07 + k * 0.145
    i = i0 + int(f * span); (x, y) = center[i]; _t1, _t2, nx, ny = NR[i]
    sz = 40 + 44 * f ** 1.1; off = [0.3, -0.28, 0.3, -0.36, 0.28, -0.1][k] * half_w(i)
    a(die(x + off*nx, y + off*ny, sz, n, [-9, 7, -5, 9, -8, -4][k]))
a('</g>')

# ================= BRENNOFEN (Mittelpunkt) =================
a('<g filter="url(#cut)">')
# Schornstein
a(f'<rect x="{KX+58}" y="408" width="60" height="196" fill="{TERRA}"/>')
for yy in range(430, 600, 26):
    a(f'<path d="M{KX+58} {yy} L{KX+118} {yy}" stroke="{CREAM}" stroke-width="2.2" stroke-dasharray="14 8" opacity=".85"/>')
a(f'<rect x="{KX+46}" y="392" width="84" height="22" fill="{INK}"/>')
# Kuppel
a(f'<path d="M{KX-KR} {KB} A{KR} {KR} 0 0 1 {KX+KR} {KB}Z" fill="{TERRA}"/>')
# leichte Licht-/Schattenfläche rechts (Versatzdruck)
a(f'<path d="M{KX+60} {KB} A{KR} {KR} 0 0 0 {KX+KR} {KB} A{KR} {KR} 0 0 0 {KX+KR-30} {KB-120} Q{KX+150} {KB-60} {KX+60} {KB}Z" fill="#B0432A" opacity=".55"/>')
rings = [74, 128, 182, 236, KR-2]
for rr in rings:
    a(f'<path d="M{KX-rr} {KB} A{rr} {rr} 0 0 1 {KX+rr} {KB}" fill="none" stroke="{CREAM}" stroke-width="3" stroke-dasharray="24 10" opacity=".9"/>')
for k in range(len(rings) - 1):
    r0, r1 = rings[k], rings[k+1]; step = 52 / r1; ang = math.pi + (0.5*step if k % 2 else 0)
    while ang < 2*math.pi - 0.02:
        a(f'<path d="M{KX+r0*math.cos(ang):.1f} {KB+r0*math.sin(ang):.1f} L{KX+r1*math.cos(ang):.1f} {KB+r1*math.sin(ang):.1f}" stroke="{CREAM}" stroke-width="2.6" opacity=".85"/>')
        ang += step
# Sockel mit Kachelband
a(f'<rect x="{KX-KR-22}" y="{KB-2}" width="{2*KR+44}" height="46" fill="{INK}"/>')
for c in range(14):
    cx = KX - KR - 4 + c * 40
    a(f'<rect x="{cx:.0f}" y="{KB+6}" width="34" height="30" fill="{CREAM if c%2==0 else "#DCE0FF"}"/><circle cx="{cx+17:.0f}" cy="{KB+21}" r="6" fill="none" stroke="{COB}" stroke-width="2.2"/><circle cx="{cx+17:.0f}" cy="{KB+21}" r="2" fill="{SUN}"/>')
# Feueröffnung: Rahmen, Glut in Schichten, glühender 6er-Würfel
mx, mw, my = KX, 96, KB - 2
def arch(w, h, col, dy=0):
    return f'<path d="M{mx-w} {my} L{mx-w} {my-h+w+dy} A{w} {w} 0 0 1 {mx+w} {my-h+w+dy} L{mx+w} {my}Z" fill="{col}"/>'
a(arch(mw+16, 168, CREAM)); a(arch(mw+4, 160, INK)); a(arch(mw-6, 150, SUN_D)); a(arch(mw-22, 128, SUN)); a(arch(mw-42, 98, '#FF9A3D')); a(arch(mw-62, 66, '#FFD27A'))
a(die(mx, my-52, 66, 6, 7, shadow=False))
a('</g>')

# Rauch zur Sonne
sm = cr([(KX+88, 380),(KX+104, 332),(KX+86, 286),(KX+110, 240),(KX+98, 196)], n=24)
a(f'<path d="{d(sm)}" fill="none" stroke="{CREAM}" stroke-width="10" stroke-linecap="round" filter="url(#cut)"/>')

# Vordergrund-Blätter
a('<g filter="url(#cut)">')
for (x, y, ang, ln, wd, fc) in [(-30,1230,-1.05,400,84,COB_D),(10,1240,-0.6,330,64,COB),(60,1250,-1.3,290,58,'#14156F'),
                                (830,1230,-2.2,400,86,COB_D),(790,1250,-2.7,330,68,COB),(760,1250,-1.95,290,58,'#14156F')]:
    a(big_leaf(x, y, ang, ln, wd, fc, '#F7EEE4' if fc != COB else '#CFD3FF'))
a('</g>')

# Wortmarke
a(f'<text x="52" y="250" font-family="Bricolage Grotesque" font-size="262" font-weight="600" fill="{INK}" style="font-variation-settings:\'wdth\' 75,\'opsz\' 96;letter-spacing:-4px">Glut.</text>')
a(f'<text x="58" y="306" font-family="Bricolage Grotesque" font-size="30" font-weight="600" fill="{INK}" style="font-variation-settings:\'wdth\' 90,\'opsz\' 14">W&#252;rfel, die abbrennen.</text>')
a(f'<rect width="{W}" height="{H}" fill="#FFF8F0" filter="url(#speck)" opacity=".55"/>')
a('</svg>')
print('\n'.join(o))
