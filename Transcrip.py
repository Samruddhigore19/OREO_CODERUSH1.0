# import os
# import cdflib
# import numpy as np
# import pandas as pd


# def read_safe(cdf, varname, nrows, split=False):
#     """
#     Safely read a variable and ensure it's usable in a DataFrame.
#     - If 1D: return directly
#     - If 2D and split=True: return dict of separate columns
#     - If 2D: average across axis=1
#     - If missing: return NaNs
#     """
#     try:
#         data = np.array(cdf.varget(varname))

#         if data.ndim == 1:
#             return data

#         elif data.ndim == 2:
#             if split:  # keep each column separately
#                 return {f"{varname}_{i}": data[:, i] for i in range(data.shape[1])}
#             else:  # average across 2D
#                 return np.mean(data, axis=1)

#         else:
#             return np.full(nrows, np.nan)

#     except Exception:
#         return np.full(nrows, np.nan)


# def cdf_to_csv(input_folder, output_folder):
#     os.makedirs(output_folder, exist_ok=True)

#     for file in os.listdir(input_folder):
#         if not file.endswith(".cdf"):
#             continue

#         file_path = os.path.join(input_folder, file)
#         print(f"[INFO] Processing {file_path}...")

#         try:
#             cdf = cdflib.CDF(file_path)

#             # --- Time ---
#             time = cdflib.cdfepoch.to_datetime(cdf.varget("epoch_for_cdf_mod"))
#             nrows = len(time)

#             data_dict = {"time": pd.to_datetime(time)}

#             # --- Flux variables ---
#             for i in range(15, 20):
#                 var = f"integrated_flux_s{i}_mod"
#                 result = read_safe(cdf, var, nrows)
#                 if isinstance(result, dict):  # multi-column
#                     data_dict.update(result)
#                 else:
#                     data_dict[f"flux_s{i}"] = result

#             # --- Other variables ---
#             data_dict["energy_center"] = read_safe(cdf, "energy_center_mod", nrows)
#             data_dict["energy_uncer"] = read_safe(cdf, "energy_uncer", nrows)

#             # spacecraft position might be vector → split into 3 columns
#             sc_result = read_safe(cdf, "spacecraft_position", nrows, split=True)
#             if isinstance(sc_result, dict):
#                 data_dict.update(sc_result)
#             else:
#                 data_dict["sc_pos"] = sc_result

#             # fallback if spacecraft_xpos, etc. exist separately
#             data_dict["sc_x"] = read_safe(cdf, "spacecraft_xpos", nrows)
#             data_dict["sc_y"] = read_safe(cdf, "spacecraft_ypos", nrows)
#             data_dict["sc_z"] = read_safe(cdf, "spacecraft_zpos", nrows)

#             data_dict["sun_angle"] = read_safe(cdf, "sun_angle_tha2", nrows)

#             # --- Build DataFrame ---
#             df = pd.DataFrame(data_dict).set_index("time")

#             # --- Save to CSV ---
#             out_file = os.path.join(output_folder, file.replace(".cdf", ".csv"))
#             df.to_csv(out_file, float_format="%.6f")
#             print(f"[OK] Saved: {out_file}")

#         except Exception as e:
#             print(f"[ERROR] Failed on {file_path}: {e}")


# # -------- Example usage --------
# input_folder = r"d:\temp\Projects\Conv\data_cdf"   # folder containing .cdf files
# output_folder = r"d:\temp\Projects\Conv\data_csv"  # output folder for .csv files
# cdf_to_csv(input_folder, output_folder)
#/////////////////////////////////////////////////////////////////////////////////////////////////////////#

# 
import os
import cdflib
import numpy as np
import pandas as pd


# ---- Required columns to extract ----
REQUIRED_VARS = [
    "integrated_flux_mod",
    "integrated_flux_s15_mod",
    "integrated_flux_s16_mod",
    "integrated_flux_s17_mod",
    "integrated_flux_s18_mod",
    "integrated_flux_s19_mod",
    "energy_center_mod",       # energy bins
    "spacecraft_xpos",
    "spacecraft_ypos",
    "spacecraft_zpos",
    "sun_angle_tha2"           # will expand into multiple cols
]


def read_variable(cdf, varname, nrows):
    """Ensure variable is returned as 1D or split into multiple columns if needed."""
    try:
        data = np.array(cdf.varget(varname))

        if data.ndim == 1:   # already good
            return {varname: data}

        elif data.ndim == 2: # e.g. (N, M) → split into multiple columns
            out = {}
            for i in range(data.shape[1]):
                out[f"{varname}_{i}"] = data[:, i]
            return out

        else:  # too many dimensions → fill with NaN
            return {varname: np.full(nrows, np.nan)}

    except Exception:
        return {varname: np.full(nrows, np.nan)}


def cdf_to_csv(file_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    print(f"[INFO] Processing {file_path}...")

    cdf = cdflib.CDF(file_path)

    # --- Time ---
    try:
        time = cdflib.cdfepoch.to_datetime(cdf.varget("epoch"))
    except:
        try:
            time = cdflib.cdfepoch.to_datetime(cdf.varget("epoch_for_cdf_mod"))
        except:
            raise ValueError("No valid epoch variable found in file")

    nrows = len(time)
    data_dict = {"time": pd.to_datetime(time)}

    # --- Only keep required variables ---
    for var in REQUIRED_VARS:
        if var in cdf.cdf_info().zVariables:
            values = read_variable(cdf, var, nrows)
            data_dict.update(values)
        else:
            print(f"[WARN] Variable '{var}' not found in {file_path}")

    # --- Build DataFrame ---
    df = pd.DataFrame(data_dict).set_index("time")

    # --- Save ---
    base = os.path.basename(file_path).replace(".cdf", ".csv")
    out_file = os.path.join(output_folder, base)
    df.to_csv(out_file, float_format="%.6f")
    print(f"[OK] Saved: {out_file}")


# -------- Example usage --------
if __name__ == "__main__":
    input_file   = r"d:\temp\Projects\Conv\data_cdf\AL1_ASW91_L2_TH2_20250819_UNP_9999_999999_V02.cdf"
    output_folder = r"d:\temp\Projects\Conv\data_csv"

    cdf_to_csv(input_file, output_folder)
