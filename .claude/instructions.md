每次開啟時，先讀取專案根目錄的 CLAUDE.md 了解目前進度和待辦事項，主動告訴使用者目前狀況和下一步建議。

注意事項：
- Node/npm/gh 路徑需要 PATH="/usr/local/bin:$PATH"
- psql 路徑: /usr/local/Cellar/postgresql@16/16.13/bin/psql
- preview server 用 launch.json name: "edumind"
- 每次完成工作後主動詢問是否要 commit + push GitHub
