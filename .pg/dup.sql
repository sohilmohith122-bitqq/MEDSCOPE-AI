SELECT "fileName", count(*) FROM "Document" GROUP BY "fileName" HAVING count(*) > 1;
