Logging : Solr API http://localhost:8983/solr/admin/info/logging 
Write the API for multi node data : in backend/src/routes/solr.ts
Update the page: fronend/src/pages/DatacenterLogging.tsx
Design:  like other pages you already desgined alignment with the same style. 
Solr Documentation: https://solr.apache.org/guide/solr/latest/deployment-guide/configuring-logging.html

It should have tabs of each node of Solr, then checkbox to filters by the loglvel. It should not add the stress at node for getting the logs, user need to have freedom to set the refresh button plus time, appen the latest lon on top. 

Write the logic to get the logs only when needed. Don't make calls unnesesary so Solr gets effected. 