import zipfile, os, pathlib
z = zipfile.ZipFile('.pg/pg-bin.zip')
outs = [n for n in z.namelist() if n.startswith('pgsql/bin/') or n.startswith('pgsql/lib/') or n.startswith('pgsql/share/') or n.startswith('pgsql/include/')]
print("to extract:", len(outs))
count = 0
for n in outs:
    if n.endswith('/'):
        continue
    tgt = os.path.join('.pg/extract', n)
    pathlib.Path(os.path.dirname(tgt)).mkdir(parents=True, exist_ok=True)
    if os.path.exists(tgt):
        count += 1
        continue
    with z.open(n) as src, open(tgt, 'wb') as dst:
        import shutil
        shutil.copyfileobj(src, dst)
    count += 1
    if count % 500 == 0:
        print(f"extracted {count}/{len(outs)}")
print(f"done {count}")