process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'directv.com.ar',
  url: `https://www.directv.com.ar/guia/ChannelDetail.aspx/GetProgramming`,
  request: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      Cookie: 'PGCSS=16; PGLang=S; PGCulture=es-AR;'
    },
    data({ channel, date }) {
      const [channelNum, channelName] = channel.site_id.split('#')

      return {
        filterParameters: {
          day: date.date(),
          time: 0,
          minute: 0,
          month: date.month() + 1,
          year: date.year(),
          offSetValue: 0,
          filtersScreenFilters: [''],
          isHd: '',
          isChannelDetails: 'Y',
          channelNum,
          channelName: channelName.replace('&amp;', '&')
        }
      }
    }
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.description,
        rating: parseRating(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  }
}

function parseRating(item) {
  return item.rating
    ? {
        system: 'MPA',
        value: item.rating
      }
    : null
}

function parseStart(item) {
  return dayjs.tz(item.startTimeString, 'M/D/YYYY h:mm:ss A', 'America/Argentina/Buenos_Aires')
}

function parseStop(item) {
  return dayjs.tz(item.endTimeString, 'M/D/YYYY h:mm:ss A', 'America/Argentina/Buenos_Aires')
}

function parseItems(content, channel) {
  if (!content) return []
  let [ChannelNumber, ChannelName] = channel.site_id.split('#')
  ChannelName = ChannelName.replace('&amp;', '&')
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.d)) return []
  const channelData = data.d.find(
    c => c.ChannelNumber == ChannelNumber && c.ChannelName === ChannelName
  )

  return channelData && Array.isArray(channelData.ProgramList) ? channelData.ProgramList : []
}
