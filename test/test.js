/* global it, describe */

var expect = require('chai').expect;

import _test from '../src/test';

import {adjustGroup} from '../src/utils/Utils';

describe('This',function(){
    describe("that",function(){
        it("sings Halleluja",function(){
            return true;
        });
        it("has matching test export",function(){
            expect(_test).to.equal("tester");
        });
    });
});

describe("adjustGroup()",function(){
    it("exports properly",function(){
        expect(adjustGroup).to.not.equal(undefined);
        expect(adjustGroup).to.not.equal(null);
    });
    it("adjusts an image from a 4x5 grid to a 1x2 grid",function(){
        let data = [10,14];
        expect(
            adjustGroup(
                data,
                {
                    x:[2,2],
                    y:[2,3]
                },
                4
            )
        ).to.deep.equal([0,1]);
    });
});
