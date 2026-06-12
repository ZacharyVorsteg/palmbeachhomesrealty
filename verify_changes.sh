#!/bin/bash

echo "=== VERIFYING DESIGNER CHANGES ==="

# Check 1: Gold colors
echo -e "\n1. Gold Colors:"
grep "^    --gold-600:\|^    --gold-500:\|^    --gold-400:" styles.css

# Check 2: Hero sub opacity
echo -e "\n2. Hero Sub Opacity:"
grep -A 2 "\.hero-sub {" styles.css | grep opacity

# Check 3: Text shadow on hero sub
echo -e "\n3. Hero Sub Text Shadow:"
grep -A 10 "\.hero-sub {" styles.css | grep text-shadow

# Check 4: Form label color
echo -e "\n4. Form Label Color:"
grep -A 5 "\.form-group label {" styles.css | grep color

# Check 5: Section dividers opacity
echo -e "\n5. Section Dividers (general):"
grep -A 6 "\.section + \.section::before {" styles.css | grep opacity

# Check 6: About divider opacity
echo -e "\n6. About Section Divider:"
grep -A 6 "\.about::before {" styles.css | grep opacity

# Check 7: Form input focus shadow
echo -e "\n7. Form Input Focus Shadow:"
grep -A 6 "\.form-group input:focus" styles.css | grep box-shadow

# Check 8: Footer link contrast
echo -e "\n8. Footer Link Contrast:"
grep -A 5 "\.footer-col a {" styles.css | grep color

# Check 9: Mobile nav shadow
echo -e "\n9. Mobile Nav Shadow:"
grep -A 10 "\.nav-mobile {" styles.css | grep box-shadow

# Check 10: Mobile nav active state border
echo -e "\n10. Mobile Nav Active State Border:"
grep -A 5 "\.nav-mobile a:hover, \.nav-mobile a\.active {" styles.css | grep border

# Check 11: Tablet heading tightness
echo -e "\n11. Tablet H1 Letter Spacing (768px):"
grep -A 3 "@media (max-width: 768px)" styles.css | grep -A 2 "\.hero h1"

# Check 12: Mobile area card text sizes
echo -e "\n12. Mobile Area Card Sizes (768px):"
grep -A 8 "@media (max-width: 768px)" styles.css | grep -A 2 "\.area-card"

# Check 13: Mobile H1 letter spacing (480px)
echo -e "\n13. Mobile H1 Letter Spacing (480px):"
grep -A 2 "@media (max-width: 480px)" styles.css | tail -15 | grep -A 2 "\.hero h1"

# Check 14: Mobile area cards (480px)
echo -e "\n14. Mobile Area Cards (480px):"
grep -A 6 "@media (max-width: 480px)" styles.css | tail -10 | grep -A 2 "\.area-card"

