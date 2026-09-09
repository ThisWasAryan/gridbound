import sys
import re
from svgpathtools import parse_path
def get_closest_point_on_path(point, path, num_samples=2000):
    min_dist = float('inf')
    closest_t = 0
    for i in range(num_samples + 1):
        t = i / num_samples
        p = path.point(t)
        dist = abs(p - point)
        if dist < min_dist:
            min_dist = dist
            closest_t = t
    return path.point(closest_t), closest_t
def get_closest_point_on_path_tracked(point, path, prev_t, window=0.1, num_samples=100):
    min_dist = float('inf')
    closest_t = prev_t
    for i in range(num_samples + 1):
        t_offset = (i / num_samples) * 2 * window - window
        t = (prev_t + t_offset) % 1.0
        p = path.point(t)
        dist = abs(p - point)
        if dist < min_dist:
            min_dist = dist
            closest_t = t
    return path.point(closest_t), closest_t
def smooth_points(points, window=5):
    smoothed = []
    n = len(points)
    for i in range(n):
        avg_r = 0
        avg_i = 0
        for j in range(-window, window + 1):
            idx = (i + j) % n
            avg_r += points[idx].real
            avg_i += points[idx].imag
        smoothed.append(complex(avg_r / (2 * window + 1), avg_i / (2 * window + 1)))
    return smoothed
def generate_smooth_path_d(points):
    d = []
    n = len(points)
    d.append(f"M {points[0].real:.2f},{points[0].imag:.2f}")
    
    for i in range(n):
        p0 = points[(i - 1) % n]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n]
        
        alpha = 1.0 / 6.0
        c1 = p1 + alpha * (p2 - p0)
        c2 = p2 - alpha * (p3 - p1)
        
        d.append(f"C {c1.real:.2f},{c1.imag:.2f} {c2.real:.2f},{c2.imag:.2f} {p2.real:.2f},{p2.imag:.2f}")
    
    d.append("Z")
    return " ".join(d)
def generate_sector_d(points, start_frac, end_frac):
    n = len(points)
    start_idx = int(start_frac * n)
    end_idx = int(end_frac * n)
    
    if end_idx < start_idx:
        sector_points_indices = list(range(start_idx, n)) + list(range(0, end_idx + 1))
    else:
        sector_points_indices = list(range(start_idx, end_idx + 1))
        
    d = [f"M {points[sector_points_indices[0]].real:.2f},{points[sector_points_indices[0]].imag:.2f}"]
    
    for i in range(len(sector_points_indices) - 1):
        orig_i = sector_points_indices[i]
        p0 = points[(orig_i - 1) % n]
        p1 = points[orig_i]
        p2 = points[(orig_i + 1) % n]
        p3 = points[(orig_i + 2) % n]
        
        alpha = 1.0 / 6.0
        c1 = p1 + alpha * (p2 - p0)
        c2 = p2 - alpha * (p3 - p1)
        
        d.append(f"C {c1.real:.2f},{c1.imag:.2f} {c2.real:.2f},{c2.imag:.2f} {p2.real:.2f},{p2.imag:.2f}")
        
    return " ".join(d)
def process_svg(file_path):
    print(f"Processing {file_path}...")
    with open(file_path, 'r') as f:
        svg_text = f.read()
        
    m = re.search(r'<path[^>]*id="track-surface"[^>]*d="([^"]+)"', svg_text)
    if not m:
        print("No #track-surface found.")
        return
    
    track_surface = parse_path(m.group(1))
        
    subpaths = track_surface.continuous_subpaths()
    if len(subpaths) != 2:
        print(f"Expected 2 subpaths (outer and inner), found {len(subpaths)}")
        return
        
    outer = subpaths[0]
    inner = subpaths[1]
    
    if inner.length() > outer.length():
        outer, inner = inner, outer
    num_points = 400
    midpoints = []
    
    prev_t_inner = None
    
    for i in range(num_points):
        t = i / num_points
        p_outer = outer.point(t)
        p_inner = get_closest_point_on_path(p_outer, inner, num_samples=1000)
        
        if prev_t_inner is None:
            p_inner, prev_t_inner = get_closest_point_on_path(p_outer, inner, num_samples=3000)
        else:
            p_inner, prev_t_inner = get_closest_point_on_path_tracked(p_outer, inner, prev_t_inner, window=0.1, num_samples=200)
            
        p_center = (p_outer + p_inner) / 2
        midpoints.append(p_center)
        
    midpoints = smooth_points(midpoints, window=4)
    midpoints = smooth_points(midpoints, window=5)
    
    raceline_d = generate_smooth_path_d(midpoints)
        
    # Extract sectors
    sectors = [0, 0.33, 0.66, 1.0]
    m_sectors = re.search(r'data-sectors="([^"]+)"', svg_text)
    if m_sectors:
        sectors = [float(x) for x in m_sectors.group(1).split(',')]
        
    sector1_d = generate_sector_d(midpoints, sectors[0], sectors[1])
    sector2_d = generate_sector_d(midpoints, sectors[1], sectors[2])
    sector3_d = generate_sector_d(midpoints, sectors[2], sectors[3])
    
    # Now replace the d attributes using regex carefully
    # 1. raceline
    svg_text = re.sub(
        r'(<path[^>]*id="raceline"[^>]*?d=")[^"]+(")',
        r'\g<1>' + raceline_d.replace('\\', '\\\\') + r'\g<2>',
        svg_text,
        flags=re.DOTALL
    )
    
    # 2. sectors
    for sec_num, sec_d in [(1, sector1_d), (2, sector2_d), (3, sector3_d)]:
        svg_text = re.sub(
            r'(<path[^>]*data-sector="' + str(sec_num) + r'"[^>]*?d=")[^"]+(")',
            r'\g<1>' + sec_d.replace('\\', '\\\\') + r'\g<2>',
            svg_text,
            flags=re.DOTALL
        )
        
    # 3. Start finish line
    p0_inner_t = prev_t_inner if prev_t_inner is not None else 0
    start_line = f'<line id="start-finish-line" x1="{outer.point(0).real:.2f}" y1="{outer.point(0).imag:.2f}" x2="{inner.point(p0_inner_t).real:.2f}" y2="{inner.point(p0_inner_t).imag:.2f}" stroke="#FFFFFF" stroke-width="8" stroke-dasharray="8,8" />'
    
    if 'id="start-finish-line"' in svg_text:
        svg_text = re.sub(r'<line id="start-finish-line"[^>]*/>', start_line, svg_text)
    else:
        svg_text = svg_text.replace('</svg>', f'    {start_line}\n</svg>')
    with open(file_path, 'w') as f:
        f.write(svg_text)
        
    print(f"Updated {file_path}")
if __name__ == '__main__':
    for f in sys.argv[1:]:
        process_svg(f)
