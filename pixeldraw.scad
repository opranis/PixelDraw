ledmatrix_len = 192; //led matrix length
bevel_len = 20; //matrix to edge length
box_depth = 80; //the depth of the whole thing
recess_len = 20; //how far the matrix should be recessed

glass_overreach = 5;
glass_thickness = 2;

matrix_holder_rad = 15;

charger_rad = 10;
charger_clearance = 10;

screw_rad = 2.75/2; //M3 screw

lid_thickness = 3;

difference(){
    $fn = 50;
    translate([0, 0, -10]){
        minkowski(){
            cylinder(h=lid_thickness/2, r=2);
            cube([ledmatrix_len+2*bevel_len, ledmatrix_len+2*bevel_len, lid_thickness/2]);
        }
    }
    translate([bevel_len, bevel_len, -20]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
    translate([bevel_len+ledmatrix_len, bevel_len, -20]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
    translate([bevel_len, bevel_len+ledmatrix_len, -20]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
    translate([bevel_len+ledmatrix_len, bevel_len+ledmatrix_len, -20]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
}

difference(){
    union(){
        difference(){
            $fn = 50;
            minkowski(){
                cylinder(h=box_depth/2, r=2);
                cube([ledmatrix_len+2*bevel_len, ledmatrix_len+2*bevel_len, box_depth/2]);
            }
            translate([bevel_len, bevel_len, -box_depth/2]){
                cube([ledmatrix_len, ledmatrix_len, 2*box_depth]);
            }
            translate([bevel_len-glass_overreach, bevel_len-glass_overreach, box_depth-glass_thickness]){
                cube([ledmatrix_len+2*glass_overreach, ledmatrix_len+2*glass_overreach, box_depth]);
            }
            translate([bevel_len+charger_rad+matrix_holder_rad+charger_clearance,1.5*bevel_len,charger_rad+charger_clearance]){
                rotate([90,0,0]){
                    cylinder(h=2*bevel_len, r=charger_rad);
                }
            }
        }

        translate([bevel_len, bevel_len, 0]){
            cylinder(h=box_depth-recess_len-glass_thickness, r=matrix_holder_rad);
        }
        
        translate([bevel_len+ledmatrix_len, bevel_len, 0]){
            cylinder(h=box_depth-recess_len-glass_thickness, r=matrix_holder_rad);
        }
        
        translate([bevel_len, bevel_len+ledmatrix_len, 0]){
            cylinder(h=box_depth-recess_len-glass_thickness, r=matrix_holder_rad);
        }
        
        translate([bevel_len+ledmatrix_len, bevel_len+ledmatrix_len, 0]){
            cylinder(h=box_depth-recess_len-glass_thickness, r=matrix_holder_rad);
        }
    }
    translate([bevel_len, bevel_len, -10]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
    translate([bevel_len+ledmatrix_len, bevel_len, -10]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
    translate([bevel_len, bevel_len+ledmatrix_len, -10]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
    translate([bevel_len+ledmatrix_len, bevel_len+ledmatrix_len, -10]){
        cylinder(h=box_depth-recess_len-glass_thickness, r=screw_rad);
    }
}