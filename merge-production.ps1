# Merge Script: main + sub → Production
# Run from repo root: .\merge-production.ps1

# 1. Create Production branch from main
git checkout main
git checkout -b Production

# 2. Start merge from sub (no commit, no fast-forward)
git merge sub --no-commit --no-ff

# 3. Resolve conflicts: pick OURS (main) for security, keamanan, cron
#    pick THEIRS (sub) for UI files
git checkout main -- lib/rbac/can.ts
git checkout main -- app/api/cron/bill-reminder/route.ts
git checkout main -- app/api/cron/cleanup-piket/route.ts

git checkout sub -- app/(dashboard)/SidebarNav.tsx
git checkout sub -- app/(dashboard)/admin/akun/AccountSettingsClient.tsx
git checkout sub -- app/(dashboard)/admin/akun/page.tsx
git checkout sub -- app/(dashboard)/admin/akun/actions.ts
git checkout sub -- app/login/page.tsx
git checkout sub -- user/user-dashboard.tsx
git checkout sub -- app/(dashboard)/admin/kebersihan/KebersihanUserView.tsx
git checkout sub -- app/(dashboard)/admin/keuangan/KeuanganClient.tsx
git checkout sub -- components/HomeClient.tsx

git checkout sub -- next.config.ts
git checkout sub -- package.json
git checkout sub -- .gitignore

# 4. Add all new files from sub
git add app/(dashboard)/SidebarNav.tsx

# 5. Clean: remove orphan SidebarShell
git rm --cached components/ui/SidebarShell.tsx 2>$null
Remove-Item components/ui/SidebarShell.tsx -ErrorAction SilentlyContinue

# 6. Commit
git commit -m "Merge main+sub into Production: SIMAS UI + Keamanan security + IuranConfig"

Write-Host "Done. Branch Production ready."
