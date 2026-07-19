package main

import "testing"

// TestTestModeFromEnv verifies the SPAR_TEST_MODE gate: it defaults OFF for any
// missing/empty/falsey value and only turns ON for explicit truthy values. This
// is the guarantee that the DB-optional boot never triggers in production.
func TestTestModeFromEnv(t *testing.T) {
	cases := map[string]bool{
		"":        false, // unset -> production boot
		"0":       false,
		"false":   false,
		"no":      false,
		"off":     false,
		"random":  false,
		"1":       true,
		"true":    true,
		"TRUE":    true,
		"  true ": true,
		"yes":     true,
		"on":      true,
		"On":      true,
	}
	for val, want := range cases {
		getenv := func(key string) string {
			if key == "SPAR_TEST_MODE" {
				return val
			}
			return ""
		}
		if got := testModeFromEnv(getenv); got != want {
			t.Errorf("testModeFromEnv(%q) = %v, want %v", val, got, want)
		}
	}
}

// TestTestModeDefaultsOffWhenEnvAbsent asserts the strict default: when the env
// lookup returns empty for everything, test mode is off.
func TestTestModeDefaultsOffWhenEnvAbsent(t *testing.T) {
	if testModeFromEnv(func(string) string { return "" }) {
		t.Fatal("SPAR_TEST_MODE must default to OFF")
	}
}
