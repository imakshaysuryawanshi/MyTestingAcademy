import pandas as pd

input_path = r"w:\The Testing Acedamy\Antigravity\My Projects\Project_01_VWO\Input\Test Metrics.xlsx"
df = pd.read_excel(input_path, header=None)

with open(r"w:\The Testing Acedamy\Antigravity\My Projects\Project_01_VWO\Input\metrics_output.txt", "w", encoding="utf-8") as f:
    f.write(df.to_string())
