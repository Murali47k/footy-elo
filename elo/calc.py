import pandas as pd
from def_elo import BASE_ELO, ELO_CONFIG, get_stat_weight

def calculate_elo(input_csv, output_csv):
    """
    Calculate ELO ratings from stats CSV
    """
    print(f"Calculating ELO from {input_csv}...")
    
    df = pd.read_csv(input_csv)

    required_cols = {"ParticipantName", "TeamName", "Position"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    df = df.fillna(0)

    # Raw ELO calculation
    def compute_raw_elo(row):
        position = row["Position"]
        elo_delta = 0.0

        for stat, value in row.items():
            if stat in ("ParticipantName", "TeamName", "Position"):
                continue

            weight = get_stat_weight(position, stat)
            if weight != 0:
                elo_delta += value * weight

        return BASE_ELO + (ELO_CONFIG["K_FACTOR"] * elo_delta)

    df["ELO_RAW"] = df.apply(compute_raw_elo, axis=1)

    # Position-normalized ELO
    df["ELO"] = 0

    for pos in df["Position"].unique():
        mask = df["Position"] == pos
        pos_mean = df.loc[mask, "ELO_RAW"].mean()

        df.loc[mask, "ELO"] = (
            BASE_ELO + (df.loc[mask, "ELO_RAW"] - pos_mean)
        )

    # Clamp floor & round
    df["ELO"] = (
        df["ELO"]
        .clip(lower=ELO_CONFIG["MIN_ELO"])
        .round()
        .astype(int)
    )

    # Final table
    elo_df = (
        df[["ParticipantName", "TeamName", "Position", "ELO"]]
        .sort_values("ELO", ascending=False)
        .reset_index(drop=True)
    )

    # Save
    elo_df.to_csv(output_csv, index=False)

    print(f"✅ ELO saved to {output_csv}")
    print(f"   Players: {elo_df.shape[0]}")
    print(f"\nTop 10:")
    print(elo_df.head(10).to_string(index=False))
    
    return elo_df

if __name__ == '__main__':
    # Test
    calculate_elo("tables/pl.csv", "elo_tables/pl_elo.csv")