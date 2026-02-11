-- Test queries to debug purchase indents issue

USE bhuvaneswari;

-- 1. Check all purchase indents and their workflow stages
SELECT 
    indent_id,
    indent_number,
    workflow_stage,
    status,
    requested_by,
    created_at
FROM purchase_indents
ORDER BY created_at DESC;

-- 2. Check purchase indents specifically for Store Officer
SELECT 
    indent_id,
    indent_number,
    workflow_stage,
    status,
    requested_by,
    created_at
FROM purchase_indents
WHERE workflow_stage = 'Store Officer'
ORDER BY created_at DESC;

-- 3. Check if there are any materials for the indents
SELECT 
    pi.indent_number,
    pi.workflow_stage,
    COUNT(pim.indent_material_id) as material_count
FROM purchase_indents pi
LEFT JOIN purchase_indent_materials pim ON pi.indent_id = pim.indent_id
GROUP BY pi.indent_id
ORDER BY pi.created_at DESC;

-- 4. Check users and their roles
SELECT 
    u.user_id,
    u.username,
    u.email,
    r.role_name
FROM users u
JOIN roles r ON u.role_id = r.role_id;

-- 5. Check roles table
SELECT * FROM roles;
