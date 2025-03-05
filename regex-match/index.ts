import * as core from "@actions/core";

interface Input {
  targetString: string;
  regexString: string;
  regexFlags?: string;
}

function getInput(): Input {
  const targetString = core.getInput("target");
  const regexString = core.getInput("regex");
  const isGlobal = core.getBooleanInput("global");
  const isMultiline = core.getBooleanInput("multiline");
  const isInsensitive = core.getBooleanInput("case-insensitive");

  let regexFlags = "";
  if (isGlobal) regexFlags += 'g'
  if (isMultiline) regexFlags += 'm'
  if (isInsensitive) regexFlags += 'i'

  return {
    targetString,
    regexString,
    regexFlags
  };
}

function getMatches(targetString: string, regexString: string, regexFlags: string) {
  const regexp = new RegExp(regexString, regexFlags);
  const result = regexp.exec(targetString);

  if (!result) {
    return {
      matches: false,
      results: []
    }
  }

  return {
    matches: true,
    results: result!
  }
}

try {
  const { targetString, regexString, regexFlags } = getInput();
  const {
    matches,
    results
  } = getMatches(targetString, regexString, regexFlags);

  for (let i = 0; i < 9; i++) {
    core.setOutput(`group${i}`, i < results.length ? results[i]: '');
  }

  core.setOutput('matches', matches)
} catch (error) {
  core.setFailed(error.message);
}
