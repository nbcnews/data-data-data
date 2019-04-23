const fs = require('fs')
const glob = require('glob')

const d3 = require(`d3-dsv`)
const unique = require(`lodash.uniq`)
const ora = require(`ora`)

const config = require(`./config.json`)

const fecSchedulaAVersion83Headers = [
  "FORM TYPE",
  "FILER COMMITTEE ID NUMBER",
  "TRANSACTION ID",
  "BACK REFERENCE TRAN ID NUMBER",
  "BACK REFERENCE SCHED NAME",
  "ENTITY TYPE",
  "CONTRIBUTOR ORGANIZATION NAME",
  "CONTRIBUTOR LAST NAME",
  "CONTRIBUTOR FIRST NAME",
  "CONTRIBUTOR MIDDLE NAME",
  "CONTRIBUTOR PREFIX",
  "CONTRIBUTOR SUFFIX",
  "CONTRIBUTOR STREET",
  "CONTRIBUTOR STREET",
  "CONTRIBUTOR CITY",
  "CONTRIBUTOR STATE",
  "CONTRIBUTOR ZIP",
  "ELECTION CODE",
  "ELECTION OTHER DESCRIPTION",
  "CONTRIBUTION DATE",
  "CONTRIBUTION AMOUNT",
  "CONTRIBUTION AGGREGATE",
  "CONTRIBUTION PURPOSE DESCRIP",
  "CONTRIBUTOR EMPLOYER",
  "CONTRIBUTOR OCCUPATION",
  "DONOR COMMITTEE FEC ID",
  "DONOR COMMITTEE NAME",
  "DONOR CANDIDATE FEC ID",
  "DONOR CANDIDATE LAST NAME",
  "DONOR CANDIDATE FIRST NAME",
  "DONOR CANDIDATE MIDDLE NAME",
  "DONOR CANDIDATE PREFIX",
  "DONOR CANDIDATE SUFFIX",
  "DONOR CANDIDATE OFFICE",
  "DONOR CANDIDATE STATE",
  "DONOR CANDIDATE DISTRICT",
  "CONDUIT NAME",
  "CONDUIT STREET1",
  "CONDUIT STREET2",
  "CONDUIT CITY",
  "CONDUIT STATE",
  "CONDUIT ZIP",
  "MEMO CODE",
  "MEMO TEXT / DESCRIPTION",
  "Reference to SI or SL system code that identifies the Account"
]

const contributorId = row => {
  return `${row["CONTRIBUTOR FIRST NAME"]}~${row["CONTRIBUTOR LAST NAME"]}@${row["CONTRIBUTOR STATE"]}-${row["CONTRIBUTOR ZIP"]}`
}

const readCsvFile = (campaignCsvPath) => {
  const spinner = ora(`Reading in data from ${campaignCsvPath}`).start()
  return new Promise((resolve, reject) => {
    const contributions = []
    const rows = fs.readFileSync(campaignCsvPath)
      .toString()
      .split('\n')

    rows.forEach(row => {
      const isContribution = row.match(/^"SA17A"/)
      if (!isContribution) return

      const split = row.split(`,`)
      const withHeaders = {}
      split.forEach((s, i) => {
        const header = fecSchedulaAVersion83Headers[i]
        withHeaders[header] = s.replace(/"/g, ``)
      })

      contributions.push(withHeaders)
    })

    spinner.succeed(`Parsed ${campaignCsvPath}`)
    resolve({
      contributions
    })
  })
}

glob(`./inputs/committee-*.csv`, (err, files) => {
  const contributions = {}
  const reading = files.map(filePath => readCsvFile(filePath))

  Promise.all(reading).then(results => {
    const spinner = ora(`Figuring out contributors who gave to multiple campaigns`).start()
    const allResults = results.reduce((accum, next) => {
      return accum.concat(next.contributions)
    }, [])

    allResults.forEach(row => {
      if (
        // probably don't drop this on the floor, we need to audit this kind of stuff
        // maybe this stuff ends up in a different file with some sort of indication of which return
        // statement it was dropped from
        !row[`TRANSACTION ID`] ||
        row[`TRANSACTION ID`].match(/E$/) ||
        !row[`CONTRIBUTION AMOUNT`]
      ) return

      const id = contributorId(row)
      if (!contributions[id]) {
        contributions[id] = []
      }

      contributions[id].push([
        row[`FILER COMMITTEE ID NUMBER`],
        +row[`CONTRIBUTION AMOUNT`],
        row[`CONTRIBUTION DATE`]
      ])
    })

    const committeeIds = config.committees.map(c => c.id)
    const contributorIds = Object.keys(contributions)
    const contributorsToMultipleCampaigns = []

    console.log('contributor count', contributorIds.length)

    contributorIds.forEach(id => {
      const c = contributions[id]
      const row = { id }

      const uniqueCommitteesContributedTo = unique(c.map(cc => cc[0]))

      if (uniqueCommitteesContributedTo.length < 2) return
      if (id.includes(`~@DC-00000`)) return

      committeeIds.forEach(committeeId => {
        const sum = c.filter(cc => cc[0] === committeeId)
          .reduce((accum, next) => {
            return accum + next[1]
          }, 0)
        row[committeeId] = sum
      })

      row['committee-count'] = uniqueCommitteesContributedTo.length
      contributorsToMultipleCampaigns.push(row)
    })

    const csv = d3.csvFormat(contributorsToMultipleCampaigns)
    fs.writeFileSync(`./outputs/donors-to-multiple-committees.csv`, csv)
    spinner.succeed(`Created outputs/donors-to-multiple-committees.csv`)
    return contributorsToMultipleCampaigns
  }).then(contributorsToMultipleCampaigns => {
    const committeeIds = config.committees.map(c => c.id)
    const spinner = ora(`Making "grid" csv`).start()
    const rows = committeeIds.map(rowCommitteeId => {
      const row = {
        id: rowCommitteeId,
      }

      const contributionsToRow = contributorsToMultipleCampaigns.filter(contribution => {
        return contribution[rowCommitteeId] > 0
      })

      committeeIds.forEach(colCommitteeId => {
        if (!row[colCommitteeId]) {
          row[colCommitteeId] = 0
        }
        contributionsToRow.forEach(contribution => {
          if (!contribution[colCommitteeId]) return
          row[colCommitteeId] = row[colCommitteeId] + 1
        })

        if (rowCommitteeId === colCommitteeId) {
          row[colCommitteeId] = ''
        }
      })

      return row
    })

    const csv = d3.csvFormat(rows, [`id`].concat(committeeIds))
    fs.writeFileSync(`./outputs/donors-to-multiple-committees-grid.csv`, csv)
    spinner.succeed(`Created outputs/donors-to-multiple-committees-grid.csv`)
  })
})