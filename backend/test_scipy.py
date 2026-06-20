import numpy as np
import scipy.stats as stats

try:
    data = [1, 2, 3]
    arr = np.array(data)
    print("arr created")
    n = len(arr)
    mean = float(np.mean(arr))
    median = float(np.median(arr))
    print(f"mean: {mean}, median: {median}")

    modes, counts = stats.mode(arr, keepdims=True)
    print("mode calculated")
    mode_list = [float(m) for m in modes]
    print(f"mode list: {mode_list}")
    
    variance = float(np.var(arr, ddof=0))
    std = float(np.std(arr, ddof=0))
    q1 = float(np.percentile(arr, 25))
    q3 = float(np.percentile(arr, 75))
    print(f"var: {variance}, std: {std}, q1: {q1}, q3: {q3}")
except Exception as e:
    import traceback
    traceback.print_exc()
