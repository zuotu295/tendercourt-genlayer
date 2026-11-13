"""Package original SDK receipt JSON files without changing their bytes."""
import gzip
import hashlib
import io
import json
import pathlib
import tarfile

root = pathlib.Path(__file__).resolve().parent.parent / 'evidence' / 'v2.2'
files = sorted(root.glob('cases/*/receipts/*.json'))
if not files:
    raise SystemExit('No receipts to archive')
index = []
with (root / 'receipts.tar.gz').open('wb') as output:
    with gzip.GzipFile(fileobj=output, mode='wb', mtime=0) as compressed:
        with tarfile.open(fileobj=compressed, mode='w|') as archive:
            for path in files:
                content = path.read_bytes()
                name = path.relative_to(root).as_posix()
                info = tarfile.TarInfo(name)
                info.size = len(content)
                info.mode = 0o644
                archive.addfile(info, io.BytesIO(content))
                index.append({'path': name, 'bytes': len(content),
                              'sha256': hashlib.sha256(content).hexdigest()})
(root / 'receipt-index.json').write_text(json.dumps(index, indent=2) + '\n')
print(f'Archived {len(index)} original receipts; bytes and hashes indexed')
