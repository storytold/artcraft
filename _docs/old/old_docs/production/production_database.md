Production Database
===================

Secrets can be subbed in for `.env` and the standard diesel migration tooling will work.

Dump a MySQL report
-------------------

```bash
mysql -u storyteller \
  -pPasswordHere \
  -h IP_HERE \
  -P 3306 \
  -D storyteller \
  -B \
  -e "select * from voice_clone_requests;" | sed "s/'/\'/;s/\t/\",\"/g;s/^/\"/;s/$/\"/;s/\n//g" > voice_clone_report.csv
```
